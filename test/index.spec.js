"use strict";
const assert = require("assert");
const babelPresetEnv = require("../lib/index.js");

describe("babel-preset-env", () => {
  describe("isPluginRequired", () => {
    const MAX_VERSION = `${Number.MAX_SAFE_INTEGER}.0.0`;

    it("returns true if no targets are specified", () => {
      assert.strictEqual(babelPresetEnv.isPluginRequired({}, {}), true);
    });

    it("returns true if plugin feature is not implemented in one or more targets", () => {
      let targets;
      const plugin = {
        edge: false,
        firefox: 45,
        chrome: 49,
      };

      targets = {
        chrome: MAX_VERSION,
        firefox: MAX_VERSION,
      };
      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        false,
      );

      targets = {
        edge: "12",
      };
      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        true,
      );
    });

    it("returns false if plugin feature is implemented by lower than target", () => {
      const plugin = {
        chrome: 49,
      };
      const targets = {
        chrome: MAX_VERSION,
      };

      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        false,
      );
    });

    it("returns false if plugin feature is implemented is equal to target", () => {
      const plugin = {
        chrome: 49,
      };
      const targets = {
        chrome: "49.0.0",
      };
      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        false,
      );
    });

    it("returns true if plugin feature is implemented is greater than target", () => {
      const plugin = {
        chrome: 50,
      };
      const targets = {
        chrome: "49.0.0",
      };
      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        true,
      );
    });

    it("returns true if uglify is specified as a target", () => {
      const plugin = {
        chrome: 50,
      };
      const targets = {
        chrome: "55.0.0",
        uglify: true,
      };
      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        true,
      );
    });

    it("returns when target is a decimal", () => {
      const plugin = {
        node: 6.9,
      };
      const targets = {
        node: "6.10.0",
      };
      assert.strictEqual(
        babelPresetEnv.isPluginRequired(targets, plugin),
        false,
      );
    });

    it("throws an error if target version is invalid", () => {
      const plugin = {
        chrome: 50,
      };
      const targets = {
        chrome: 55,
      };
      assert.throws(() => babelPresetEnv.isPluginRequired(targets, plugin));
    });
  });

  describe("transformIncludesAndExcludes", () => {
    it("should return in transforms array", () => {
      assert.deepEqual(
        babelPresetEnv.transformIncludesAndExcludes([
          "transform-es2015-arrow-functions",
        ]),
        {
          all: ["transform-es2015-arrow-functions"],
          plugins: new Set(["transform-es2015-arrow-functions"]),
          builtIns: new Set(),
        },
      );
    });

    it("should return in built-ins array", () => {
      assert.deepEqual(
        babelPresetEnv.transformIncludesAndExcludes(["es6.map"]),
        {
          all: ["es6.map"],
          plugins: new Set(),
          builtIns: new Set(["es6.map"]),
        },
      );
    });
  });

  describe("onPresetBuild", () => {
    it("should call onCompile callback", () => {
      let calls = 0;
      const onPresetBuild = () => calls++;
      babelPresetEnv.default({}, { onPresetBuild });
      assert(calls === 1);
    });

    it("should call onCompile callback with correct targets", () => {
      const targets = { chrome: "60" };
      babelPresetEnv.default(
        {},
        {
          targets,
          onPresetBuild: ({ targets: compiledTargets }) => {
            assert.deepEqual(targets, compiledTargets);
          },
        },
      );
    });

    it("should call onCompile callback with correct transformationsWithTargets", () => {
      const targets = { chrome: "55" };
      const transformationsWithTargetsArray = [
        {
          name: "syntax-trailing-function-commas",
          targets: { chrome: "55" },
        },
      ];
      babelPresetEnv.default(
        {},
        {
          targets,
          onPresetBuild: ({ transformationsWithTargets }) => {
            assert.deepEqual(
              transformationsWithTargetsArray,
              Array.from(transformationsWithTargets),
            );
          },
        },
      );
    });

    it("should call onCompile callback with correct polyfillsWithTargets (`entry` option)", () => {
      const targets = { chrome: "55" };
      const polyfillsWithTargetsArray = [
        { name: "es7.string.pad-start", targets: { chrome: "55" } },
        { name: "es7.string.pad-end", targets: { chrome: "55" } },
        { name: "web.timers", targets: { chrome: "55" } },
        { name: "web.immediate", targets: { chrome: "55" } },
        { name: "web.dom.iterable", targets: { chrome: "55" } },
      ];
      babelPresetEnv.default(
        {},
        {
          targets,
          useBuiltIns: "entry",
          onPresetBuild: ({ polyfillsWithTargets }) => {
            assert.deepEqual(
              polyfillsWithTargetsArray,
              Array.from(polyfillsWithTargets),
            );
          },
        },
      );
    });
  });
});
