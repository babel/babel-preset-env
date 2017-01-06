import pluginList from "../data/plugins.json";
import pluginFeatures from "../data/plugin-features";
import builtInsList from "../data/built-ins.json";
import browserslist from "browserslist";
import transformPolyfillRequirePlugin from "./transform-polyfill-require-plugin";
import electronToChromium from "../data/electron-to-chromium";

export const MODULE_TRANSFORMATIONS = {
  "amd": "transform-es2015-modules-amd",
  "commonjs": "transform-es2015-modules-commonjs",
  "systemjs": "transform-es2015-modules-systemjs",
  "umd": "transform-es2015-modules-umd"
};

const defaultInclude = [
  "web.timers",
  "web.immediate",
  "web.dom.iterable"
];

export const validIncludesAndExcludes = [
  ...Object.keys(pluginFeatures),
  ...Object.keys(MODULE_TRANSFORMATIONS).map((m) => MODULE_TRANSFORMATIONS[m]),
  ...Object.keys(builtInsList),
  ...defaultInclude
];

/**
 * Determine if a transformation is required
 * @param  {Object}  supportedEnvironments  An Object containing environment keys and the lowest
 *                                          supported version as a value
 * @param  {Object}  plugin                 An Object containing environment keys and the lowest
 *                                          version the feature was implmented in as a value
 * @return {Boolean}  Whether or not the transformation is required
 */
export const isPluginRequired = (supportedEnvironments, plugin) => {
  if (supportedEnvironments.browsers) {
    supportedEnvironments = getTargets(supportedEnvironments);
  }

  const targetEnvironments = Object.keys(supportedEnvironments);

  if (targetEnvironments.length === 0) { return true; }

  const isRequiredForEnvironments = targetEnvironments
    .filter((environment) => {
      // Feature is not implemented in that environment
      if (!plugin[environment]) { return true; }

      const lowestImplementedVersion = plugin[environment];
      const lowestTargetedVersion = supportedEnvironments[environment];

      if (typeof lowestTargetedVersion === "string") {
        throw new Error(`Target version must be a number, 
          '${lowestTargetedVersion}' was given for '${environment}'`);
      }

      return lowestTargetedVersion < lowestImplementedVersion;
    });

  return isRequiredForEnvironments.length > 0 ? true : false;
};

const isBrowsersQueryValid = (browsers) => {
  return typeof browsers === "string" || Array.isArray(browsers);
};

const browserNameMap = {
  chrome: "chrome",
  edge: "edge",
  firefox: "firefox",
  ie: "ie",
  ios_saf: "ios",
  safari: "safari"
};

const getLowestVersions = (browsers) => {
  return browsers.reduce((all, browser) => {
    const [browserName, browserVersion] = browser.split(" ");
    const normalizedBrowserName = browserNameMap[browserName];
    const parsedBrowserVersion = parseInt(browserVersion);
    if (normalizedBrowserName && !isNaN(parsedBrowserVersion)) {
      all[normalizedBrowserName] = Math.min(all[normalizedBrowserName] || Infinity, parsedBrowserVersion);
    }
    return all;
  }, {});
};

const mergeBrowsers = (fromQuery, fromTarget) => {
  return Object.keys(fromTarget).reduce((queryObj, targKey) => {
    if (targKey !== "browsers") {
      queryObj[targKey] = fromTarget[targKey];
    }
    return queryObj;
  }, fromQuery);
};

export const getCurrentNodeVersion = () => {
  return parseFloat(process.versions.node);
};

export const electronVersionToChromeVersion = (semverVer) => {
  semverVer = String(semverVer);

  if (semverVer === "1") {
    semverVer = "1.0";
  }

  const m = semverVer.match(/^(\d+\.\d+)/);
  if (!m) {
    throw new Error("Electron version must be a semver version");
  }

  let result = electronToChromium[m[1]];
  if (!result) {
    throw new Error(`Electron version ${m[1]} is either too old or too new`);
  }

  return result;
};

const _extends = Object.assign || function (target) {
  for (let i = 1; i < arguments.length; i++) {
    const source = arguments[i];
    for (let key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};


export const getTargets = (targets = {}) => {
  const targetOps = _extends({}, targets);

  if (targetOps.node === true || targetOps.node === "current") {
    targetOps.node = getCurrentNodeVersion();
  }

  // Rewrite Electron versions to their Chrome equivalents
  if (targetOps.electron) {
    targetOps.chrome = electronVersionToChromeVersion(targetOps.electron);
    delete targetOps.electron;
  }

  const browserOpts = targetOps.browsers;
  if (isBrowsersQueryValid(browserOpts)) {
    const queryBrowsers = getLowestVersions(browserslist(browserOpts));
    return mergeBrowsers(queryBrowsers, targetOps);
  }
  return targetOps;
};

// TODO: Allow specifying plugins as either shortened or full name
// babel-plugin-transform-es2015-classes
// transform-es2015-classes
export const validateLooseOption = (looseOpt = false) => {
  if (typeof looseOpt !== "boolean") {
    throw new Error("Preset env: 'loose' option must be a boolean.");
  }

  return looseOpt;
};

export const validateModulesOption = (modulesOpt = "commonjs") => {
  if (modulesOpt !== false && Object.keys(MODULE_TRANSFORMATIONS).indexOf(modulesOpt) === -1) {
    throw new Error("The 'modules' option must be 'false' to indicate no modules\n" +
      "or a module type which be be one of: 'commonjs' (default), 'amd', 'umd', 'systemjs'");
  }

  return modulesOpt;
};

export function validatePluginsOption(opts = [], type) {
  if (!Array.isArray(opts)) {
    throw new Error(`The '${type}' option must be an Array<string> of plugins/built-ins`);
  }

  let unknownOpts = [];
  opts.forEach((opt) => {
    if (validIncludesAndExcludes.indexOf(opt) === -1) {
      unknownOpts.push(opt);
    }
  });

  if (unknownOpts.length > 0) {
    throw new Error(`Invalid plugins/built-ins '${unknownOpts}' passed to '${type}' option.
      Check data/[plugin-features|built-in-features].js in babel-preset-env`);
  }

  return {
    all: opts,
    plugins: opts.filter((opt) => !opt.match(/^(es\d+|web)\./)),
    builtIns: opts.filter((opt) => opt.match(/^(es\d+|web)\./))
  };
}

const validateIncludeOption = (opts) => validatePluginsOption(opts, "include");
const validateExcludeOption = (opts) => validatePluginsOption(opts, "exclude");

export function checkDuplicateIncludeExcludes(include, exclude) {
  let duplicates = [];
  include.forEach((opt) => {
    if (exclude.indexOf(opt) >= 0) {
      duplicates.push(opt);
    }
  });

  if (duplicates.length > 0) {
    throw new Error(`Duplicate plugins/built-ins: '${duplicates}' found
      in both the "include" and "exclude" options.`);
  }
}

let hasBeenLogged = false;
let hasBeenWarned = false;

const logPlugin = (plugin, targets, list) => {
  const envList = list[plugin] || {};
  const filteredList = Object.keys(targets)
  .reduce((a, b) => {
    a[b] = envList[b];
    return a;
  }, {});
  const logStr = `  ${plugin} ${JSON.stringify(filteredList)}`;
  console.log(logStr);
};

export default function buildPreset(context, opts = {}) {
  const loose = validateLooseOption(opts.loose);
  const moduleType = validateModulesOption(opts.modules);
  // TODO: remove whitelist in favor of include in next major
  if (opts.whitelist && !hasBeenWarned) {
    hasBeenWarned = true;
    console.warn(`The "whitelist" option has been deprecated
    in favor of "include" to match the newly added "exclude" option (instead of "blacklist").`);
  }
  const include = validateIncludeOption(opts.whitelist || opts.include);
  const exclude = validateExcludeOption(opts.exclude);
  checkDuplicateIncludeExcludes(include.all, exclude.all);
  const targets = getTargets(opts.targets);
  const debug = opts.debug;
  const useBuiltIns = opts.useBuiltIns;

  let transformations = Object.keys(pluginList)
    .filter((pluginName) => isPluginRequired(targets, pluginList[pluginName]));

  let polyfills;
  if (useBuiltIns) {
    polyfills = Object.keys(builtInsList)
      .filter((builtInName) => isPluginRequired(targets, builtInsList[builtInName]))
      .concat(defaultInclude)
      .filter((plugin) => exclude.builtIns.indexOf(plugin) === -1)
      .concat(include.builtIns);
  }

  if (debug && !hasBeenLogged) {
    hasBeenLogged = true;
    console.log("babel-preset-env: `DEBUG` option");
    console.log("\nUsing targets:");
    console.log(JSON.stringify(targets, null, 2));
    console.log(`\nModules transform: ${moduleType}`);
    console.log("\nUsing plugins:");
    transformations.forEach((transform) => {
      logPlugin(transform, targets, pluginList);
    });
    console.log("\nUsing polyfills:");
    if (useBuiltIns && polyfills.length) {
      polyfills.forEach((polyfill) => {
        logPlugin(polyfill, targets, builtInsList);
      });
    }
  }

  const allTransformations = transformations
  .filter((plugin) => exclude.plugins.indexOf(plugin) === -1)
  .concat(include.plugins);

  const regenerator = allTransformations.indexOf("transform-regenerator") >= 0;
  const modulePlugin = moduleType !== false && MODULE_TRANSFORMATIONS[moduleType];
  const plugins = [];

  modulePlugin &&
    plugins.push([require(`babel-plugin-${modulePlugin}`), { loose }]);

  plugins.push(...allTransformations.map((pluginName) =>
    [require(`babel-plugin-${pluginName}`), { loose }]
  ));

  useBuiltIns &&
    plugins.push([transformPolyfillRequirePlugin, { polyfills, regenerator }]);

  return {
    plugins
  };
}
