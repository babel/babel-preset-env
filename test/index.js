"use strict";

const babelPresetEnv = require("../lib/index.js");
const assert = require("assert");

const MODULE_TRANSFORMATIONS = babelPresetEnv.MODULE_TRANSFORMATIONS;

describe("babel-preset-env", () => {
  describe("isPluginRequired", () => {
    it("returns true if no targets are specified", () => {
      const isRequired = babelPresetEnv.isPluginRequired({}, {});
      assert(isRequired);
    });
    it("returns true if plugin feature is not implemented in one or more targets", () => {
      let targets;
      const plugin = {
        edge: false,
        firefox: 45,
        chrome: 49,
      }

      targets = {
        "chrome": Number.MAX_SAFE_INTEGER,
        "firefox": Number.MAX_SAFE_INTEGER
      };
      assert(babelPresetEnv.isPluginRequired(targets, plugin) === false);

      targets = {
        "edge": 12,
      };
      assert(babelPresetEnv.isPluginRequired(plugin, plugin) === true);
    });
  });
  describe("getModules", () => {
    describe("Boolean argument", () => {
      it("should return an empty Array if passed a falsy value", () => {
        assert.deepEqual(babelPresetEnv.getModuleTransformations(), []);
        assert.deepEqual(babelPresetEnv.getModuleTransformations(null), []);
        assert.deepEqual(babelPresetEnv.getModuleTransformations(false), []);
      });
      it("should return an Array of all module transformations if passed `true`", () => {
        const allModuleTransformations = Object
          .keys(MODULE_TRANSFORMATIONS)
          .map(keys => MODULE_TRANSFORMATIONS[keys]);

        assert.deepEqual(babelPresetEnv.getModuleTransformations(Object.keys(MODULE_TRANSFORMATIONS)), allModuleTransformations);
      });
    });
    describe("String argument", () => {
      it("should return an empty Array if passed an unrecognized module type", () => {
        assert.deepEqual(babelPresetEnv.getModuleTransformations("shoelacestrap.js"), []);
      });
      it("should return an Array with the specified module transformation if passed a valid module string", () => {
        const validModuleType = Object.keys(MODULE_TRANSFORMATIONS)[0];

        const moduleTransformations = babelPresetEnv.getModuleTransformations(validModuleType)
        assert.deepEqual(moduleTransformations, [MODULE_TRANSFORMATIONS[validModuleType]]);
      });
    });
    describe("Array argument", () => {
      it("should return an empty Array if passed an empty array", () => {
        assert.deepEqual(babelPresetEnv.getModuleTransformations([]), []);
      });
      it("should return an Array with the module transformations if passed an Array of module types", () => {
        const moduleTypes = Object.keys(MODULE_TRANSFORMATIONS);

        const moduleTransformations = babelPresetEnv.getModuleTransformations([moduleTypes[0], moduleTypes[1]])
        assert.deepEqual(moduleTransformations, [MODULE_TRANSFORMATIONS[moduleTypes[0]], MODULE_TRANSFORMATIONS[moduleTypes[1]]]);
      });
      it("should ignore invalid Array elements if passed an Array of module types", () => {
        const moduleTypes = Object.keys(MODULE_TRANSFORMATIONS);

        const moduleTransformations = babelPresetEnv.getModuleTransformations([moduleTypes[0], null, moduleTypes[1], "HenryFord.js"])
        assert.deepEqual(moduleTransformations, [MODULE_TRANSFORMATIONS[moduleTypes[0]], MODULE_TRANSFORMATIONS[moduleTypes[1]]]);
      });
    });
  });
});
