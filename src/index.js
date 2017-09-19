//@flow

import semver from "semver";
import builtInsList from "../data/built-ins.json";
import { logPlugin } from "./debug";
import { defaultWebIncludes } from "./default-includes";
import moduleTransformations from "./module-transformations";
import normalizeOptions from "./normalize-options.js";
import pluginList from "../data/plugins.json";
import {
  builtIns as stage3BuiltIns,
  plugins as stage3Plugins,
  pluginSyntaxMap,
} from "../data/stage3.js";
import useBuiltInsEntryPlugin from "./use-built-ins-entry-plugin";
import addUsedBuiltInsPlugin from "./use-built-ins-plugin";
import getTargets from "./targets-parser";
import availablePlugins from "./available-plugins";
import { filterStageFromList, prettifyTargets, semverify } from "./utils";
import type { Plugin, Targets } from "./types";

const getPlugin = (pluginName: string) => {
  const plugin = availablePlugins[pluginName];

  if (!plugin) {
    throw new Error(
      `Could not find plugin "${pluginName}". Ensure there is an entry in ./available-plugins.js for it.`,
    );
  }

  return plugin;
};

const builtInsListWithoutStage3 = filterStageFromList(
  builtInsList,
  stage3BuiltIns,
);
const pluginListWithoutStage3 = filterStageFromList(pluginList, stage3Plugins);

export const isPluginRequired = (
  supportedEnvironments: Targets,
  plugin: Targets,
): boolean => {
  const targetEnvironments: Array<string> = Object.keys(supportedEnvironments);

  if (targetEnvironments.length === 0) {
    return true;
  }

  const isRequiredForEnvironments: Array<
    string,
  > = targetEnvironments.filter(environment => {
    // Feature is not implemented in that environment
    if (!plugin[environment]) {
      return true;
    }

    const lowestImplementedVersion: string = plugin[environment];
    const lowestTargetedVersion: string = supportedEnvironments[environment];

    if (!semver.valid(lowestTargetedVersion)) {
      throw new Error(
        // eslint-disable-next-line max-len
        `Invalid version passed for target "${environment}": "${lowestTargetedVersion}". Versions must be in semver format (major.minor.patch)`,
      );
    }

    return semver.gt(
      semverify(lowestImplementedVersion),
      lowestTargetedVersion,
    );
  });

  return isRequiredForEnvironments.length > 0;
};

let hasBeenLogged = false;

const getBuiltInTargets = targets => {
  const builtInTargets = Object.assign({}, targets);
  if (builtInTargets.uglify != null) {
    delete builtInTargets.uglify;
  }
  return builtInTargets;
};

export const transformIncludesAndExcludes = (opts: Array<string>): Object => {
  return opts.reduce(
    (result, opt) => {
      const target = opt.match(/^(es\d+|web)\./) ? "builtIns" : "plugins";
      result[target].add(opt);
      return result;
    },
    {
      all: opts,
      plugins: new Set(),
      builtIns: new Set(),
    },
  );
};

const getPlatformSpecificDefaultFor = (targets: Targets): ?Array<string> => {
  const targetNames = Object.keys(targets);
  const isAnyTarget = !targetNames.length;
  const isWebTarget = targetNames.some(name => name !== "node");

  return isAnyTarget || isWebTarget ? defaultWebIncludes : null;
};

const filterItems = (
  list,
  includes,
  excludes,
  targets,
  defaultItems,
): Set<string> => {
  const result = new Set();

  for (const item in list) {
    const excluded = excludes.has(item);

    if (!excluded) {
      if (isPluginRequired(targets, list[item])) {
        result.add(item);
      } else {
        const stage3Syntax = pluginSyntaxMap.get(item);

        if (stage3Syntax) {
          result.add(stage3Syntax);
        }
      }
    }
  }

  if (defaultItems) {
    defaultItems.forEach(item => !excludes.has(item) && result.add(item));
  }

  includes.forEach(item => result.add(item));

  return result;
};

export default function buildPreset(
  context: Object,
  opts: Object = {},
): { plugins: Array<Plugin> } {
  const {
    configPath,
    debug,
    exclude: optionsExclude,
    forceAllTransforms,
    ignoreBrowserslistConfig,
    include: optionsInclude,
    loose,
    modules,
    spec,
    stage3,
    targets: optionsTargets,
    useBuiltIns,
  } = normalizeOptions(opts);
  // TODO: remove this in next major
  let hasUglifyTarget = false;

  if (optionsTargets && optionsTargets.uglify) {
    hasUglifyTarget = true;
    delete optionsTargets.uglify;

    console.log("");
    console.log("The uglify target has been deprecated. Set the top level");
    console.log("option `forceAllTransforms: true` instead.");
    console.log("");
  }

  const targets = getTargets(optionsTargets, {
    ignoreBrowserslistConfig,
    configPath,
  });
  const include = transformIncludesAndExcludes(optionsInclude);
  const exclude = transformIncludesAndExcludes(optionsExclude);

  const transformTargets = forceAllTransforms || hasUglifyTarget ? {} : targets;

  const transformations = filterItems(
    stage3 ? pluginList : pluginListWithoutStage3,
    include.plugins,
    exclude.plugins,
    transformTargets,
  );

  let polyfills;
  let polyfillTargets;

  if (useBuiltIns) {
    polyfillTargets = getBuiltInTargets(targets);

    polyfills = filterItems(
      stage3 ? builtInsList : builtInsListWithoutStage3,
      include.builtIns,
      exclude.builtIns,
      polyfillTargets,
      getPlatformSpecificDefaultFor(polyfillTargets),
    );
  }

  const plugins = [];
  const pluginUseBuiltIns = useBuiltIns !== false;

  // NOTE: not giving spec here yet to avoid compatibility issues when
  // babel-plugin-transform-es2015-modules-commonjs gets its spec mode
  if (modules !== false && moduleTransformations[modules]) {
    plugins.push([getPlugin(moduleTransformations[modules]), { loose }]);
  }

  transformations.forEach(pluginName =>
    plugins.push([
      getPlugin(pluginName),
      { spec, loose, useBuiltIns: pluginUseBuiltIns },
    ]),
  );

  const regenerator = transformations.has("transform-regenerator");

  if (debug && !hasBeenLogged) {
    hasBeenLogged = true;
    console.log("babel-preset-env: `DEBUG` option");
    console.log("\nUsing targets:");
    console.log(JSON.stringify(prettifyTargets(targets), null, 2));
    console.log(`\nUsing modules transform: ${modules.toString()}`);
    console.log("\nUsing plugins:");
    transformations.forEach(transform => {
      logPlugin(transform, targets, pluginList);
    });

    if (!useBuiltIns) {
      console.log(
        "\nUsing polyfills: No polyfills were added, since the `useBuiltIns` option was not set.",
      );
    } else {
      console.log(
        `
Using polyfills with \`${useBuiltIns}\` option:`,
      );
    }
  }

  if (useBuiltIns === "usage" || useBuiltIns === "entry") {
    const pluginOptions = {
      debug,
      polyfills,
      regenerator,
      onDebug: (polyfills, context) => {
        polyfills.forEach(polyfill =>
          logPlugin(polyfill, polyfillTargets, builtInsList, context),
        );
      },
    };

    plugins.push([
      useBuiltIns === "usage" ? addUsedBuiltInsPlugin : useBuiltInsEntryPlugin,
      pluginOptions,
    ]);
  }

  return {
    plugins,
  };
}
