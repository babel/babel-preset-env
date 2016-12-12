# babel-preset-env [![npm](https://img.shields.io/npm/v/babel-preset-env.svg)](https://www.npmjs.com/package/babel-preset-env) [![travis](https://img.shields.io/travis/babel/babel-preset-env/master.svg)](https://travis-ci.org/babel/babel-preset-env) [![npm-downloads](https://img.shields.io/npm/dm/babel-preset-env.svg)](https://www.npmjs.com/package/babel-preset-env)

> Babel preset that automatically determines the Babel plugins you need based on your supported environments. Uses compat-table

`npm install babel-preset-env --save-dev`

```js
{
  "presets": [
    ["env", {
      "targets": {
        "browsers": ["last 2 versions", "safari >= 7"]
      }
    }]
  ]
}
```

- [How it Works](#how-it-works)
- [Install](#install)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [Caveats](#caveats)
- [Other Cool Projects](#other-cool-projects)
  
## How it Works

### Determine environment support for ECMAScript features

[#7](https://github.com/babel/babel-preset-env/issues/7) - Use external data such as [`compat-table`](https://github.com/kangax/compat-table) to determine browser support. (We should create PRs there when necessary)

![](https://cloud.githubusercontent.com/assets/588473/19214029/58deebce-8d48-11e6-9004-ee3fbcb75d8b.png)

We can periodically run [build-data.js](/scripts/build-data.js) which generates [plugins.json](/data/plugins.json).

### Maintain a mapping between javascript features and babel plugins

> Currently located at [pluginFeatures.js](/data/plugin-features.js).

This should be straightforward to do in most cases. There might be cases were plugins should be split up more or certain plugins aren't standalone enough (or impossible to do).

### Support all plugins in Babel that are considered `latest`

> Default behavior without options is the same as `babel-preset-latest`.

[#14](https://github.com/babel/babel-preset-env/issues/14) - It won't include `stage-x` plugins. env will support all plugins in what we consider the latest version of Javascript (by matching what we do in [`babel-preset-latest`](http://babeljs.io/docs/plugins/preset-latest/)).

Support a node option `"node": "current"` to only compile for the current running node version.

### Determine the lowest common denominator of plugins to be included in the preset

If you are targeting IE 8 and Chrome 55 it will include all plugins required by IE 8 since you would need to support both still.

### Support a `browsers` option like autoprefixer

[#19](https://github.com/babel/babel-preset-env/pull/19) - Use [browserslist](https://github.com/ai/browserslist) to also queries like `> 1%, last 2 versions`.

## Install

```sh
$ npm install --save-dev babel-preset-env
```

## Usage

The default behavior without options runs all transforms (acts as [babel-preset-latest](https://babeljs.io/docs/plugins/preset-latest/)).

```js
{
  "presets": ["env"]
}
```

## [Options](http://babeljs.io/docs/plugins/#pluginpresets-options)

### `targets`: `{ [string]: number }`

Defaults to `{}`.

> Takes an object of environment versions to support.
> Each target environment takes a number (you can specify a decimal like `node: 6.5`)

Example environments: "chrome, opera, edge, firefox, safari, ie, ios, android, node, electron".

The data for this is currently at: [/data/plugins.json](/data/plugins.json) and being generated by [/scripts/build-data.js](/scripts/build-data.js) using https://kangax.github.io/compat-table.

`node`: `number | "current" | true`

If you want to compile against the current node version, you can specify `"node": true` or `"node": "current"` which would be the same as `node": parseFloat(process.versions.node)`

### `browsers`: `Array<string> | string`

> A query to select browsers (ex: last 2 versions, > 5%) using [browserslist](https://github.com/ai/browserslist).  

> Note, browsers' results are overridden by explicit items from `targets`.

### `loose`: `boolean`

Defaults to `false`.
Enable "loose" transformations for any plugins in this preset that allow them.

### `modules`: `"amd" | "umd" | "systemjs" | "commonjs" | false`

Defaults to `"commonjs"`.
Enable transformation of ES6 module syntax to another module type.
Can be `false` to not transform modules.

### `debug:` `boolean`

Defaults to `false`
`console.log` out the targets and plugins being used as well as the version specified in `/data/plugins.json`.

### `whitelist`: `Array<string>`

Defaults to `[]`
Enable a whitelist of plugins to always include.

Useful if there is a bug in a native implementation, or a combination of a non-supported feature + a supported one doesn't  work.

Ex: Node 4 supports native classes but not spread.

### `useBuiltIns`: `boolean`

Defaults to `false`.

A way to apply `babel-preset-env` for polyfills (via "babel-polyfill").

> NOTE: This does not currently polyfill experimental/stage-x built-ins like the regular "babel-polyfill" does.
> This will only work with npm >= 3 (which should be used with Babel 6 anyway)

```
npm install babel-polyfill --save
```

This option will apply a new plugin that replaces the statement `import "babel-polyfill"` or `require("babel-polyfill")` with individual requires for `babel-polyfill` based on environment.

> NOTE: Only use `require("babel-polyfill");` once in your whole app. One option is to create single entry file that only contains the require statement.

In

```js
import "babel-polyfill";
```

Out (different based on environment)

```js
import "core-js/modules/es7.string.pad-start";
import "core-js/modules/es7.string.pad-end";
import "core-js/modules/web.timers";
import "core-js/modules/web.immediate";
import "core-js/modules/web.dom.iterable";
```

> This will also work for "core-js" directly (`import "core-js";`)

```
npm install core-js --save
```

---

## Examples

```js
// src
export class A {}
```

```js
// target chrome 52
{
  "presets": [
    ["env", {
      "targets": {
        "chrome": 52
      }
    }]
  ]
}

// ...

class A {}
exports.A = A;
```

```js
// target chrome 52 with webpack 2/rollup and loose mode
{
  "presets": [
    ["env", {
      "targets": {
        "chrome": 52
      },
      "modules": false,
      "loose": true
    }]
  ]
}

// ...

export class A {}
```

```js
// using browserslist
{
  "presets": [
    ["env", {
      "targets": {
        "chrome": 52,
        "browsers": ["last 2 versions", "safari 7"]
      }
    }]
  ]
}

// ...

export var A = function A() {
  _classCallCheck(this, A);
};
```

### Example with `node: true` or `node: "current"`

```js
// process.versions.node -> 6.9.0
{
  "presets": [
    ["env", {
      "targets": {
        "node": "current"
      }
    }]
  ]
}

// ...

class A {}
exports.A = A;
```

### Example with `debug: true`

```js
Using targets: {
  "node": 6.5
}

Using plugins:

module: false
transform-exponentiation-operator {}
transform-async-to-generator {}
syntax-trailing-function-commas {}
```

### Example with `whitelist`

```js
// target chrome 52 with whitelist on arrow functions
{
  "presets": [
    ["env", {
      "targets": {
        "chrome": 52
      },
      "whitelist": ["transform-es2015-arrow-functions"]
    }]
  ]
}

Using plugins:

transform-exponentiation-operator {}
transform-async-to-generator {}
syntax-trailing-function-commas {}
transform-es2015-arrow-functions {}
```

## Caveats

If you get a `SyntaxError: Unexpected token ...` error if using the [object-rest-spread](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-object-rest-spread) then make sure the plugin is at `v6.19.0`.

## Other Cool Projects

- [auto-babel](https://github.com/jakepusateri/auto-babel)
- [babel-preset-target](https://github.com/sdkennedy/babel-preset-target)
- [babel-preset-modern-node](https://github.com/michaelcontento/babel-preset-modern-node)
- [babel-preset-modern-browsers](https://github.com/christophehurpeau/babel-preset-modern-browsers)
- ?
