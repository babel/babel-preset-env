//@flow

import invariant from "invariant";
import builtInsList from "../data/built-ins.json";
import { defaultWebIncludes } from "./default-includes";
import moduleTransformations from "./module-transformations";
import pluginFeatures from "../data/plugin-features";
import type { Options, ModuleOption, BuiltInsOption } from "./types";

const validIncludesAndExcludes = [
  ...Object.keys(pluginFeatures),
  ...Object.keys(moduleTransformations).map(m => moduleTransformations[m]),
  ...Object.keys(builtInsList),
  ...defaultWebIncludes,
];

type include = "include";
type exclude = "exclude";

export const validateIncludesAndExcludes = (
  opts: Array<string> = [],
  type: include | exclude,
): Array<string> => {
  invariant(
    Array.isArray(opts),
    `Invalid Option: The '${type}' option must be an Array<String> of plugins/built-ins`,
  );

  const unknownOpts: Array<string> = [];
  opts.forEach((opt: string): void => {
    if (validIncludesAndExcludes.indexOf(opt) === -1) {
      unknownOpts.push(opt);
    }
  });

  invariant(
    unknownOpts.length === 0,
    `Invalid Option: The plugins/built-ins '${unknownOpts.join(", ")}' passed to the '${type}' option are not
    valid. Please check data/[plugin-features|built-in-features].js in babel-preset-env`,
  );

  return opts;
};

export const normalizePluginName = (plugin: string): string =>
  plugin.replace(/^babel-plugin-/, "");

export const normalizePluginNames = (plugins: Array<string>): Array<string> =>
  plugins.map(normalizePluginName);

export const checkDuplicateIncludeExcludes = (
  include: Array<string> = [],
  exclude: Array<string> = [],
): void => {
  const duplicates: Array<string> = include.filter(
    opt => exclude.indexOf(opt) >= 0,
  );

  invariant(
    duplicates.length === 0,
    `Invalid Option: The plugins/built-ins '${duplicates.join(", ")}' were found in both the "include" and
    "exclude" options.`,
  );
};

// TODO: Allow specifying plugins as either shortened or full name
// babel-plugin-transform-es2015-classes
// transform-es2015-classes
export const validateLooseOption = (looseOpt: boolean = false): boolean => {
  invariant(
    typeof looseOpt === "boolean",
    "Invalid Option: The 'loose' option must be a boolean.",
  );

  return looseOpt;
};

export const validateModulesOption = (
  modulesOpt: ModuleOption = "commonjs",
) => {
  invariant(
    modulesOpt === false ||
      Object.keys(moduleTransformations).indexOf(modulesOpt) > -1,
    `Invalid Option: The 'modules' option must be either 'false' to indicate no modules, or a
    module type which can be be one of: 'commonjs' (default), 'amd', 'umd', 'systemjs'.`,
  );

  return modulesOpt;
};

export const validateUseBuiltInsOption = (
  builtInsOpt: BuiltInsOption = true,
): BuiltInsOption => {
  invariant(
    builtInsOpt === true || builtInsOpt === false || builtInsOpt === "entry",
    `Invalid Option: The 'useBuiltIns' option must be either
    'false' to indicate no polyfill,
    '"entry"' to indicate replacing the entry polyfill, or
    'true' (default) to import only used polyfills per file`,
  );

  return builtInsOpt;
};

export const validateUseSyntaxOption = (useSyntax: boolean = true): boolean => {
  invariant(
    typeof useSyntax === "boolean",
    `Invalid Option: The 'useSyntax' option must be either
    'false' to indicate no syntax transformation, or
    'true' (default) to use syntax based on your targets`,
  );

  return useSyntax;
};

export default function normalizeOptions(opts: Object = {}): Options {
  if (opts.exclude) {
    opts.exclude = normalizePluginNames(opts.exclude);
  }

  if (opts.include) {
    opts.include = normalizePluginNames(opts.include);
  }

  checkDuplicateIncludeExcludes(opts.include, opts.exclude);

  return {
    debug: opts.debug,
    exclude: validateIncludesAndExcludes(opts.exclude, "exclude"),
    include: validateIncludesAndExcludes(opts.include, "include"),
    loose: validateLooseOption(opts.loose),
    moduleType: validateModulesOption(opts.modules),
    targets: opts.targets,
    useSyntax: validateUseSyntaxOption(opts.useSyntax),
    useBuiltIns: validateUseBuiltInsOption(opts.useBuiltIns),
  };
}
