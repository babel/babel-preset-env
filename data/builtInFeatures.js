// https://github.com/zloirock/core-js

module.exports = {
  // es2015
  // core-js/fn/map

  // "es6.typed/array-buffer": "typed arrays / ",
  "es6.typed.data-view": "typed arrays / DataView",
  "es6.typed.int8-array": "typed arrays / Int8Array",
  "es6.typed.uint8-array": "typed arrays / Uint8Array",
  "es6.typed.uint8-clamped-array": "typed arrays / Uint8ClampedArray",
  "es6.typed.int16-array": "typed arrays / Int16Array",
  "es6.typed.uint16-array": "typed arrays / Uint16Array",
  "es6.typed.int32-array": "typed arrays / Int32Array",
  "es6.typed.uint32-array": "typed arrays / Uint32Array",
  "es6.typed.float32-array": "typed arrays / Float32Array",
  "es6.typed.float64-array": "typed arrays / Float64Array",

  "es6.map": "Map",

  "es6.set": "Set",

  "es6.weak-map": "WeakMap",

  "es6.weak-set": "WeakSet",

  // no proxy

  "es6.reflect": "Reflect",
  "es6.reflect.apply": "Reflect / ",
  "es6.reflect.construct": "Reflect / Reflect.construct",
  "es6.reflect.define-property": "Reflect / Reflect.defineProperty",
  "es6.reflect.delete-property": "Reflect / Reflect.deleteProperty",
  "es6.reflect.get": "Reflect / Reflect.get",
  "es6.reflect.get-own-property-descriptor": "Reflect / Reflect.getOwnPropertyDescriptor",
  "es6.reflect.get-prototype-of": "Reflect / Reflect.getPrototypeOf",
  "es6.reflect.has": "Reflect / Reflect.has",
  "es6.reflect.is-extensible": "Reflect / Reflect.isExtensible",
  "es6.reflect.own-keys": "Reflect / Reflect.ownKeys",
  "es6.reflect.prevent-extensions": "Reflect / Reflect.preventExtensions",
  "es6.reflect.set": "Reflect / Reflect.set",
  "es6.reflect.set-prototype-of": "Reflect / Reflect.setPrototypeOf",

  "es6.promise": "Promise",

  "es6.symbol": "Symbol",

  "es6.symbol.has-instance": "well-known symbols / Symbol.hasInstance",
  "es6.symbol.is-concat-spreadable": "well-known symbols / Symbol.isConcatSpreadable",
  "es6.symbol.iterator": "well-known symbols / Symbol.iterator",
  "es6.symbol.match": "well-known symbols / Symbol.match",
  "es6.symbol.replace": "well-known symbols / Symbol.replace",
  "es6.symbol.search": "well-known symbols / Symbol.search",
  "es6.symbol.species": "well-known symbols / Symbol.species",
  "es6.symbol.split": "well-known symbols / Symbol.split",
  "es6.symbol.to-primitive": "well-known symbols / Symbol.toPrimitive",
  "es6.symbol.to-string-tag": "well-known symbols / Symbol.toStringTag",
  "es6.symbol.unscopables": "well-known symbols / Symbol.unscopables",

  "es6.object.assign": "Object static methods / Object.assign",
  "es6.object.is": "Object static methods / Object.is",
  "es6.object.get-own-property-symbols": "Object static methods / Object.getOwnPropertySymbols",
  "es6.object.set-prototype-of": "Object static methods / Object.setPrototypeOf",

  "es6.function.name": 'function "name" property',

  "es6.string.raw": "String static methods / String.raw",
  "es6.string.from-code-point": "String static methods / String.fromCodePoint",

  "es6.string.code-point-at": "String.prototype methods / String.prototype.codePointAt",
  // "es6.string.normalize": "String.prototype methods / String.prototype.normalize",
  "es6.string.repeat": "String.prototype methods / String.prototype.repeat",
  "es6.string.starts-with": "String.prototype methods / String.prototype.startsWith",
  "es6.string.ends-with": "String.prototype methods / String.prototype.endsWith",
  "es6.string.includes": "String.prototype methods / String.prototype.includes",

  "es6.regexp.flags": "RegExp.prototype properties / RegExp.prototype.flags",
  "es6.regexp.match": "RegExp.prototype properties / RegExp.prototype[Symbol.match]",
  "es6.regexp.replace": "RegExp.prototype properties / RegExp.prototype[Symbol.replace]",
  "es6.regexp.split": "RegExp.prototype properties / RegExp.prototype[Symbol.split]",
  "es6.regexp.search": "RegExp.prototype properties / RegExp.prototype[Symbol.search]",

  "es6.array.from": "Array static methods / Array.from",
  "es6.array.of": "Array static methods / Array.of",

  "es6.array.copy-within": "Array.prototype methods / Array.prototype.copyWithin",
  "es6.array.find": "Array.prototype methods / Array.prototype.find",
  "es6.array.find-index": "Array.prototype methods / Array.prototype.findIndex",
  "es6.array.fill": "Array.prototype methods / Array.prototype.fill",
  "es6.array.iterator": "Array.prototype methods / Array.prototype.keys",
  // "es6.array.iterator": "Array.prototype methods / Array.prototype.values",
  // "es6.array.iterator": "Array.prototype methods / Array.prototype.entries",

  "es6.number.is-finite": "Number properties / Number.isFinite",
  "es6.number.is-integer": "Number properties / Number.isInteger",
  "es6.number.is-safe-integer": "Number properties / Number.isSafeInteger",
  "es6.number.is-nan": "Number properties / Number.isNaN",
  "es6.number.epsilon": "Number properties / Number.EPSILON",
  "es6.number.min-safe-integer": "Number properties / Number.MIN_SAFE_INTEGER",
  "es6.number.max-safe-integer": "Number properties / Number.MAX_SAFE_INTEGER",

  "es6.math.acosh": "Math methods / Math.acosh",
  "es6.math.asinh": "Math methods / Math.asinh",
  "es6.math.atanh": "Math methods / Math.atanh",
  "es6.math.cbrt": "Math methods / Math.cbrt",
  "es6.math.clz32": "Math methods / Math.clz32",
  "es6.math.cosh": "Math methods / Math.cosh",
  "es6.math.expm1": "Math methods / Math.expm1",
  "es6.math.fround": "Math methods / Math.fround",
  "es6.math.hypot": "Math methods / Math.hypot",
  "es6.math.imul": "Math methods / Math.imul",
  "es6.math.log1p": "Math methods / Math.log1p",
  "es6.math.log10": "Math methods / Math.log10",
  "es6.math.log2": "Math methods / Math.log2",
  "es6.math.sign": "Math methods / Math.sign",
  "es6.math.sinh": "Math methods / Math.sinh",
  "es6.math.tanh": "Math methods / Math.tanh",
  "es6.math.trunc": "Math methods / Math.trunc"
};
