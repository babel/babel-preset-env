"use strict";

const babelPresetEnv = require("../lib/index.js");
const assert = require("assert");
const electronVersions = require("electron-to-chromium/versions");
const fs = require("fs-extra");
const rootPath = require("app-root-path");

describe("babel-preset-env", () => {
  describe("getTargets", () => {
    it("should return the current node version with option 'current'", function() {
      assert.deepEqual(babelPresetEnv.getTargets({
        node: true
      }), {
        node: parseFloat(process.versions.node)
      });

      assert.deepEqual(babelPresetEnv.getTargets({
        node: "current"
      }), {
        node: parseFloat(process.versions.node)
      });
    });
  });

  describe("getTargets + electron", () => {
    describe("specific version", () => {
      it("should work with a string", function() {
        assert.deepEqual(babelPresetEnv.getTargets({
          electron: "1.0"
        }), {
          chrome: 49
        });
      });

      it("should work with a number", function() {
        assert.deepEqual(babelPresetEnv.getTargets({
          electron: 1.0
        }), {
          chrome: 49
        });
      });


      it("should preserve lower Chrome number if Electron version is more recent", function() {
        assert.deepEqual(babelPresetEnv.getTargets({
          electron: 1.4,
          chrome: 50
        }), {
          chrome: 50
        });
      });

      it("should overwrite Chrome number if Electron version is older", function() {
        assert.deepEqual(babelPresetEnv.getTargets({
          electron: 1.0,
          chrome: 50
        }), {
          chrome: 49
        });
      });

      Object.keys(electronVersions).forEach((electronVersion) => {
        it(`"should work for Electron: ${electronVersion}`, function() {
          assert.deepEqual(babelPresetEnv.getTargets({
            electron: electronVersion
          }), {
            chrome: electronVersions[electronVersion]
          });
        });
      });

      it("should error if electron version is invalid", () => {
        const fixtures = [
          "0.19",
          0.19,
          999,
          "999",
        ];

        fixtures.forEach((electronVersion) => {
          assert.throws(() => {
            babelPresetEnv.getTargets({
              electron: electronVersion,
            });
          }, Error);
        });
      });
    });

    describe("Electron NOT installed", () => {
      it("`current` should throw an error", () => {
        assert.throws(() => {
          babelPresetEnv.getTargets({
            electron: "current",
          });
        }, Error);
      });

      it("`true` should throw an error", () => {
        assert.throws(() => {
          babelPresetEnv.getTargets({
            electron: true,
          });
        }, Error);
      });
    });

    describe("Electron installed locally", () => {
      const electronDir = rootPath + "/node_modules/electron";

      before(() => {
        const source = rootPath + "/test/mocks/electron.package.json";
        const destination = electronDir + "/package.json";
        if (fs.existsSync(electronDir)) fs.removeSync(electronDir);
        fs.mkdirSync(electronDir);
        fs.copySync(source, destination);
      });

      after(() => {
        fs.remove(electronDir);
      });

      it("`current` should return the locally installed Electron version", function() {
        assert.deepEqual(babelPresetEnv.getTargets({
          electron: "current"
        }), {
          chrome: parseInt(electronVersions["1.4"], 10)
        });
      });

      it("`true` should return the locally installed Electron version", function() {
        assert.deepEqual(babelPresetEnv.getTargets({
          electron: true
        }), {
          chrome: parseInt(electronVersions["1.4"], 10)
        });
      });
    });
  });

  describe("getTargets + uglify", () => {
    it("should work with `true`", function() {
      assert.deepEqual(babelPresetEnv.getTargets({
        uglify: true
      }), {
        uglify: true
      });
    });

    it("should ignore `false`", function() {
      assert.deepEqual(babelPresetEnv.getTargets({
        uglify: false
      }), {});
    });

    it("should ignore `null`", function() {
      assert.deepEqual(babelPresetEnv.getTargets({
        uglify: null
      }), {});
    });
  });

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
      };

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

    it("returns false if plugin feature is implemented by lower than target", () => {
      const plugin = {
        chrome: 49,
      };
      const targets = {
        "chrome": Number.MAX_SAFE_INTEGER,
      };
      assert(babelPresetEnv.isPluginRequired(targets, plugin) === false);
    });

    it("returns false if plugin feature is implemented is equal to target", () => {
      const plugin = {
        chrome: 49,
      };
      const targets = {
        "chrome": 49,
      };
      assert(babelPresetEnv.isPluginRequired(targets, plugin) === false);
    });

    it("returns true if plugin feature is implemented is greater than target", () => {
      const plugin = {
        chrome: 50,
      };
      const targets = {
        "chrome": 49,
      };
      assert(babelPresetEnv.isPluginRequired(targets, plugin) === true);
    });

    it("returns false if plugin feature is implemented by lower than target defined in browsers query", () => {
      const plugin = {
        chrome: 49,
      };
      const targets = {
        "browsers": "chrome > 50"
      };
      assert(babelPresetEnv.isPluginRequired(targets, plugin) === false);
    });

    it("returns true if plugin feature is implemented is greater than target defined in browsers query", () => {
      const plugin = {
        chrome: 52,
      };
      const targets = {
        "browsers": "chrome > 50"
      };
      assert(babelPresetEnv.isPluginRequired(targets, plugin) === true);
    });

    it("returns true if target's root items overrides versions defined in browsers query", () => {
      const plugin = {
        chrome: 45,
      };
      const targets = {
        browsers: "last 2 Chrome versions",
        chrome: 44
      };

      assert(babelPresetEnv.isPluginRequired(targets, plugin) === true);
    });

    it("returns true if uglify is specified as a target", () => {
      const plugin = {
        chrome: 50
      };
      const targets = {
        chrome: 55,
        uglify: true
      };

      assert(babelPresetEnv.isPluginRequired(targets, plugin) === true);
    });

    it("doesn't throw when specifying a decimal for node", () => {
      const plugin = {
        node: 6
      };

      const targets = {
        "node": 6.5
      };

      assert.doesNotThrow(() => {
        babelPresetEnv.isPluginRequired(targets, plugin);
      }, Error);
    });

    it("will throw if target version is not a number", () => {
      const plugin = {
        "node": 6,
      };

      const targets = {
        "node": "6.5",
      };

      assert.throws(() => {
        babelPresetEnv.isPluginRequired(targets, plugin);
      }, Error);
    });
  });

  describe("transformIncludesAndExcludes", function() {
    it("should return in transforms array", function() {
      assert.deepEqual(
        babelPresetEnv.transformIncludesAndExcludes(["transform-es2015-arrow-functions"]),
        {
          all: ["transform-es2015-arrow-functions"],
          plugins: ["transform-es2015-arrow-functions"],
          builtIns: []
        }
      );
    });

    it("should return in built-ins array", function() {
      assert.deepEqual(
        babelPresetEnv.transformIncludesAndExcludes(["es6.map"]),
        {
          all: ["es6.map"],
          plugins: [],
          builtIns: ["es6.map"]
        }
      );
    });
  });
});
