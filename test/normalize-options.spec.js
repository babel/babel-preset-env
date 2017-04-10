"use strict";

const normalizeOptions = require("../lib/normalize-options.js");
const assert = require("assert");

const {
  checkDuplicateIncludeExcludes,
  validateIncludesAndExcludes,
  validateLooseOption,
  validateModulesOption,
} = normalizeOptions;

describe("normalize-options", () => {
  describe("validateLooseOption", () => {
    it("`undefined` option returns false", () => {
      assert(validateLooseOption() === false);
    });

    it("`false` option returns false", () => {
      assert(validateLooseOption(false) === false);
    });

    it("`true` option returns true", () => {
      assert(validateLooseOption(true) === true);
    });

    it("array option is invalid", () => {
      assert.throws(
        () => {
          validateLooseOption([]);
        },
        Error,
      );
    });
  });

  describe("checkDuplicateIncludeExcludes", function() {
    it("should throw if duplicate names in both", function() {
      assert.throws(
        () => {
          checkDuplicateIncludeExcludes(
            ["transform-regenerator", "map"],
            ["transform-regenerator", "map"],
          );
        },
        Error,
      );
    });

    it("should not throw if no duplicate names in both", function() {
      assert.doesNotThrow(
        () => {
          checkDuplicateIncludeExcludes(["transform-regenerator"], ["map"]);
        },
        Error,
      );
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
      assert.throws(
        () => {
          validateModulesOption(true);
        },
        Error,
      );
    });

    it("array option is invalid", () => {
      assert.throws(
        () => {
          assert(validateModulesOption([]));
        },
        Error,
      );
    });
  });
  describe("validateIncludesAndExcludes", function() {
    it("should return empty arrays if undefined", function() {
      assert.deepEqual(validateIncludesAndExcludes(), []);
    });
    it("should throw if not in features", function() {
      assert.throws(
        () => {
          validateIncludesAndExcludes(["asdf"]);
        },
        Error,
      );
    });
  });
});
