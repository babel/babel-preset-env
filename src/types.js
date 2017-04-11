//@flow

// Module Types
export type AMD = "amd";
export type Commonjs = "commonjs";
export type Systemjs = "systemjs";
export type UMD = "umd";
export type ModuleOption = AMD | Commonjs | Systemjs | UMD | boolean;

// Target types
export type Target = string;

// Use unless we deprecate it.
export type NodeTarget = Target | true;
export type UglifyTarget = Target | true;
export type Targets = {
  [target: string]: Target | NodeTarget,
};

// Options
export type Options = {
  targets: Targets,
  loose: boolean,
  include: Array<string>,
  exclude: Array<string>,
  moduleType: ModuleOption,
  debug: boolean,
  useBuiltIns: boolean,
};

// Babel
export type Plugin = [Object, Object];
