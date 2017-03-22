import invariant from "invariant";
import browserslist from "browserslist";
import { electronToChromium } from "electron-to-chromium";
import builtInsList from "../data/built-ins.json";
import defaultInclude from "./default-includes";
import moduleTransformations from "./module-transformations";
import pluginFeatures from "../data/plugin-features";

const validIncludesAndExcludes = [
  ...Object.keys(pluginFeatures),
  ...Object.keys(moduleTransformations).map(m => moduleTransformations[m]),
  ...Object.keys(builtInsList),
  ...defaultInclude,
];

const validBrowserslistTargets = [
  ...browserslist.major,
  ...Object.keys(browserslist.aliases),
];

export const validateIncludesAndExcludes = (opts = [], type) => {
  invariant(
    Array.isArray(opts),
    `Invalid Option: The '${type}' option must be an Array<String> of plugins/built-ins`,
  );

  const unknownOpts = [];
  opts.forEach(opt => {
    if (validIncludesAndExcludes.indexOf(opt) === -1) {
      unknownOpts.push(opt);
    }
  });

  invariant(
    unknownOpts.length === 0,
    `Invalid Option: The plugins/built-ins '${unknownOpts}' passed to the '${type}' option are not
    valid. Please check data/[plugin-features|built-in-features].js in babel-preset-env`,
  );

  return opts;
};

export const checkDuplicateIncludeExcludes = (include = [], exclude = []) => {
  const duplicates = include.filter(opt => exclude.indexOf(opt) >= 0);

  invariant(
    duplicates.length === 0,
    `Invalid Option: The plugins/built-ins '${duplicates}' were found in both the "include" and
    "exclude" options.`,
  );
};

// TODO: Allow specifying plugins as either shortened or full name
// babel-plugin-transform-es2015-classes
// transform-es2015-classes
export const validateLooseOption = (looseOpt = false) => {
  invariant(
    typeof looseOpt === "boolean",
    "Invalid Option: The 'loose' option must be a boolean.",
  );

  return looseOpt;
};

export const validateBrowserslistOption = (browserslistOpt = false) => {
  invariant(
    typeof browserslistOpt === "boolean",
    "Invalid Option: The 'browserslist' option must be a boolean.",
  );

  return browserslistOpt;
};

export const objectToBrowserslist = object => {
  return Object.keys(object).reduce(
    (list, targetName) => {
      if (validBrowserslistTargets.indexOf(targetName) >= 0) {
        const targetVersion = object[targetName];
        return list.concat(`${targetName} ${targetVersion}`);
      }
      return list;
    },
    [],
  );
};

export const isBrowserslistQuery = query =>
  Array.isArray(query) || typeof query === "string";

export const validateModulesOption = (modulesOpt = "commonjs") => {
  invariant(
    modulesOpt === false ||
      Object.keys(moduleTransformations).indexOf(modulesOpt) > -1,
    `Invalid Option: The 'modules' option must be either 'false' to indicate no modules, or a
    module type which can be be one of: 'commonjs' (default), 'amd', 'umd', 'systemjs'.`,
  );

  return modulesOpt;
};

export const getElectronChromeVersion = electronVersion => {
  const electronChromeVersion = parseInt(
    electronToChromium(electronVersion),
    10,
  );

  invariant(
    !!electronChromeVersion,
    `Electron version ${electronVersion} is either too old or too new`,
  );

  return electronChromeVersion;
};

export default function normalizeOptions(opts) {
  checkDuplicateIncludeExcludes(opts.include, opts.exclude);

  return {
    debug: opts.debug,
    exclude: validateIncludesAndExcludes(opts.exclude, "exclude"),
    include: validateIncludesAndExcludes(opts.include, "include"),
    loose: validateLooseOption(opts.loose),
    moduleType: validateModulesOption(opts.modules),
    targets: opts.targets,
    ignoreBrowserslistConfig: validateBrowserslistOption(
      opts.ignoreBrowserslistConfig,
    ),
    useBuiltIns: opts.useBuiltIns,
  };
}
