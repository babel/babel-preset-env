"use strict";

const normalizeOptions = require("../lib/normalize-options.js");
const assert = require("assert");

const {
  checkDuplicateIncludeExcludes,
  normalizePluginNames,
  validateBoolOption,
  validateIncludesAndExcludes,
  validateModulesOption,
} = normalizeOptions;

describe("normalize-options", () => {
  describe("normalizeOptions", () => {
    it("should return normalized `include` and `exclude`", () => {
      const normalized = normalizeOptions.default({
        include: [
          "babel-plugin-transform-es2015-spread",
          "transform-es2015-classes",
        ],
      });
      assert.deepEqual(normalized.include, [
        "transform-es2015-spread",
        "transform-es2015-classes",
      ]);
    });

    it("should throw if duplicate names in `include` and `exclude`", () => {
      const normalizeWithSameIncludes = () => {
        normalizeOptions.default({
          include: ["babel-plugin-transform-es2015-spread"],
          exclude: ["transform-es2015-spread"],
        });
      };
      assert.throws(normalizeWithSameIncludes, Error);
    });
  });

  describe("validateBoolOption", () => {
    it("`undefined` option returns false", () => {
      assert(validateBoolOption("test", undefined, false) === false);
    });

    it("`false` option returns false", () => {
      assert(validateBoolOption("test", false, false) === false);
    });

    it("`true` option returns true", () => {
      assert(validateBoolOption("test", true, false) === true);
    });

    it("array option is invalid", () => {
      assert.throws(() => {
        validateBoolOption("test", [], false);
      });
    });
  });

  describe("checkDuplicateIncludeExcludes", function() {
    it("should throw if duplicate names in both", function() {
      assert.throws(() => {
        checkDuplicateIncludeExcludes(
          ["transform-regenerator", "map"],
          ["transform-regenerator", "map"],
        );
      }, Error);
    });

    it("should not throw if no duplicate names in both", function() {
      assert.doesNotThrow(() => {
        checkDuplicateIncludeExcludes(["transform-regenerator"], ["map"]);
      }, Error);
    });
  });

  describe("normalizePluginNames", function() {
    it("should drop `babel-plugin-` prefix if needed", function() {
      assert.deepEqual(
        normalizePluginNames([
          "babel-plugin-transform-es2015-object-super",
          "transform-es2015-parameters",
        ]),
        ["transform-es2015-object-super", "transform-es2015-parameters"],
      );
    });

    it("should not throw if no duplicate names in both", function() {
      assert.doesNotThrow(() => {
        checkDuplicateIncludeExcludes(["transform-regenerator"], ["map"]);
      }, Error);
    });
  });

  describe("validateModulesOption", () => {
    it("`undefined` option returns commonjs", () => {
      assert(validateModulesOption() === "commonjs");
    });

    it("`false` option returns commonjs", () => {
      assert(validateModulesOption(false) === false);
    });

    it("commonjs option is valid", () => {
      assert(validateModulesOption("commonjs") === "commonjs");
    });

    it("systemjs option is valid", () => {
      assert(validateModulesOption("systemjs") === "systemjs");
    });

    it("amd option is valid", () => {
      assert(validateModulesOption("amd") === "amd");
    });

    it("umd option is valid", () => {
      assert(validateModulesOption("umd") === "umd");
    });

    it("`true` option is invalid", () => {
      assert.throws(() => {
        validateModulesOption(true);
      }, Error);
    });

    it("array option is invalid", () => {
      assert.throws(() => {
        assert(validateModulesOption([]));
      }, Error);
    });
  });
  describe("validateIncludesAndExcludes", function() {
    it("should return empty arrays if undefined", function() {
      assert.deepEqual(validateIncludesAndExcludes(), []);
    });
    it("should throw if not in features", function() {
      assert.throws(() => {
        validateIncludesAndExcludes(["asdf"]);
      }, Error);
    });
  });
});
