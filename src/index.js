//@flow

import semver from "semver";
import builtInsList from "../data/built-ins.json";
import { logPlugin } from "./debug";
import { defaultWebIncludes } from "./default-includes";
import moduleTransformations from "./module-transformations";
import normalizeOptions from "./normalize-options.js";
import pluginList from "../data/plugins.json";
import useBuiltInsEntryPlugin from "./use-built-ins-entry-plugin";
import addUsedBuiltInsPlugin from "./use-built-ins-plugin";
import getTargets from "./targets-parser";
import availablePlugins from "./available-plugins";
import { prettifyTargets, semverify } from "./utils";
import type { Plugin, Targets } from "./types";

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

const filterItems = (list, includes, excludes, targets, defaultItems) => {
  const result = new Set();

  for (const item in list) {
    const excluded = excludes.has(item);

    if (!excluded && isPluginRequired(targets, list[item])) {
      result.add(item);
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
    debug,
    exclude: optionsExclude,
    forceAllTransforms,
    include: optionsInclude,
    loose,
    modules,
    spec,
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

  const targets = getTargets(optionsTargets);
  const include = transformIncludesAndExcludes(optionsInclude);
  const exclude = transformIncludesAndExcludes(optionsExclude);

  const transformTargets = forceAllTransforms || hasUglifyTarget ? {} : targets;

  const transformations = filterItems(
    pluginList,
    include.plugins,
    exclude.plugins,
    transformTargets,
  );

  let polyfills;
  let polyfillTargets;

  if (useBuiltIns) {
    polyfillTargets = getBuiltInTargets(targets);

    polyfills = filterItems(
      builtInsList,
      include.builtIns,
      exclude.builtIns,
      polyfillTargets,
      getPlatformSpecificDefaultFor(polyfillTargets),
    );
  }

  const plugins = [];

  if (modules !== false && moduleTransformations[modules]) {
    plugins.push([availablePlugins[moduleTransformations[modules]], { loose }]);
  }

  // NOTE: not giving spec here yet to avoid compatibility issues when
  // babel-plugin-transform-es2015-modules-commonjs gets its spec mode
  transformations.forEach(pluginName =>
    plugins.push([availablePlugins[pluginName], { spec, loose }]),
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
