"use strict";

const fs = require("fs");
const path = require("path");

const flatten = require("lodash/flatten");
const flattenDeep = require("lodash/flattenDeep");
const mapValues = require("lodash/mapValues");
const cloneDeep = require("lodash/cloneDeep");
const pluginFeatures = require("../data/plugin-features");
const builtInFeatures = require("../data/built-in-features");

const renameTests = (tests, getName) =>
  tests.map((test) => Object.assign({}, test, { name: getName(test.name) }));

const es6Data = cloneDeep(require("compat-table/data-es6"));
const es6PlusData = cloneDeep(require("compat-table/data-es2016plus"));
const envs = require("compat-table/environments");

function interpolateAllResults(rawBrowsers, tests) {
  function interpolateResults(res) {
    let browser, prevBrowser, result, prevResult, bid, prevBid;
    for (bid in rawBrowsers) {
      // For browsers that are essentially equal to other browsers,
      // copy over the results.
      browser = rawBrowsers[bid];
      if (browser.equals && res[bid] === undefined) {
        result = res[browser.equals];
        res[bid] = browser.ignore_flagged && result === "flagged" ? false : result;
      // For each browser, check if the previous browser has the same
      // browser full name (e.g. Firefox) or family name (e.g. Chakra) as this one.
      } else if (prevBrowser &&
          (prevBrowser.full.replace(/,.+$/, "") === browser.full.replace(/,.+$/, "") ||
          (browser.family !== undefined && prevBrowser.family === browser.family))) {
        // For each test, check if the previous browser has a result
        // that this browser lacks.
        result     = res[bid];
        prevResult = res[prevBid];
        if (prevResult !== undefined && result === undefined) {
          res[bid] = prevResult;
        }
      }
      prevBrowser = browser;
      prevBid = bid;
    }
  }

  // Now print the results.
  tests.forEach(function(t) {
    // Calculate the result totals for tests which consist solely of subtests.
    if ("subtests" in t) {
      t.subtests.forEach(function(e) {
        interpolateResults(e.res);
      });
    }
    else interpolateResults(t.res);
  });
}

interpolateAllResults(es6Data.browsers, es6Data.tests);
interpolateAllResults(es6PlusData.browsers, es6PlusData.tests);

const invertedEqualsEnv = Object.keys(envs)
  .filter((b) => envs[b].equals)
  .reduce((a, b) => {
    if (!a[envs[b].equals]) {
      a[envs[b].equals] = [b];
    } else {
      a[envs[b].equals].push(b);
    }
    return a;
  }, {});

invertedEqualsEnv.safari5 = ["ios6"];
if (Array.isArray(invertedEqualsEnv.safari6)) {
  invertedEqualsEnv.safari6.push("ios7");
} else {
  invertedEqualsEnv.safari6 = ["ios7"];
}
invertedEqualsEnv.safari8 = ["ios9"];

const compatibilityTests = flattenDeep([
  es6Data,
  es6PlusData,
].map((data) =>
  data.tests.map((test) => {
    return test.subtests ?
      [test, renameTests(test.subtests, (name) => test.name + " / " + name)] :
      test;
  })
));

const environments = [
  "chrome",
  "opera",
  "edge",
  "firefox",
  "safari",
  "node",
  "ie",
  "android",
  "ios",
  "phantom"
];

const environmentsWithFlags = ["chrome", "edge", "node"];

const envMap = {
  safari51: "safari5",
  safari71_8: "safari8",
  firefox3_5: "firefox3",
  firefox3_6: "firefox3",
  node010: "node0.10",
  node012: "node0.12",
  iojs: "node3.3",
  node64: "node6",
  node65: "node6.5",
  android40: "android4.0",
  android41: "android4.1",
  android42: "android4.2",
  android43: "android4.3",
  android44: "android4.4",
  android50: "android5.0",
  android51: "android5.1",
  ios51: "ios5.1",
};

const getLowestImplementedVersion = ({ features }, env, flag) => {
  const tests = flatten(compatibilityTests
    .filter((test) => {
      return features.indexOf(test.name) >= 0 ||
      // for features === ["DataView"]
      // it covers "DataView (Int8)" and "DataView (UInt8)"
      features.length === 1 && test.name.indexOf(features[0]) === 0;
    })
    .map((test) => {
      const isBuiltIn = test.category === "built-ins" || test.category === "built-in extensions";

      return test.subtests ?
        test.subtests.map((subtest) => ({
          name: `${test.name}/${subtest.name}`,
          res: subtest.res,
          isBuiltIn
        })) :
      {
        name: test.name,
        res: test.res,
        isBuiltIn
      };
    })
  );

  const envTests = tests
    .map(({ res: test, isBuiltIn }) => {
      // Babel itself doesn't implement the feature correctly,
      // don't count against it
      // only doing this for built-ins atm
      if (!test.babel && isBuiltIn) {
        return "-1";
      }

      // `equals` in compat-table
      Object.keys(test).forEach((t) => {
        const invertedEnvs = invertedEqualsEnv[envMap[t] || t];
        if (invertedEnvs) {
          invertedEnvs.forEach((inv) => {
            test[inv] = test[t];
          });
        }
      });

      return Object.keys(test)
      .filter((t) => t.startsWith(env))
      // Babel assumes strict mode
      .filter((t) => test[t] === true || test[t] === "strict" || (flag && test[t] === "flagged"))
      // normalize some keys
      .map((test) => envMap[test] || test)
      .filter((test) => !isNaN(parseInt(test.replace(env, ""))))
      .shift();
    });

  const envFiltered = envTests.filter((t) => t);
  if (envTests.length > envFiltered.length || envTests.length === 0) {
    // envTests.forEach((test, i) => {
    //   if (!test) {
    //     // print unsupported features
    //     if (env === 'node') {
    //       console.log(`ENV(${env}): ${tests[i].name}`);
    //     }
    //   }
    // });
    return null;
  }

  return envTests
    .map((str) => Number(str.replace(env, "")))
    .reduce((a, b) => { return (a < b) ? b : a; });
};

const generateData = (environments, features) => {
  return mapValues(features, (options) => {
    if (!options.features) {
      options = {
        features: [options]
      };
    }

    const plugin = {};
    environments.forEach((env) => {
      const version = getLowestImplementedVersion(options, env);
      if (version !== null) {
        plugin[env] = version;
      }
    });

    environmentsWithFlags.forEach((env) => {
      if (Array.isArray(options.features)) {
        const version = getLowestImplementedVersion(options, env, true);
        if (version !== null) {
          plugin[`${env}-flag`] = version;
        }
      }
    });

    // add opera
    if (plugin.chrome) {
      if (plugin.chrome >= 28) {
        plugin.opera = plugin.chrome - 13;
      } else if (plugin.chrome === 5) {
        plugin.opera = 12;
      }
    }

    return plugin;
  });
};

fs.writeFileSync(
  path.join(__dirname, "../data/plugins.json"),
  JSON.stringify(generateData(environments, pluginFeatures), null, 2) + "\n"
);

fs.writeFileSync(
  path.join(__dirname, "../data/built-ins.json"),
  JSON.stringify(generateData(environments, builtInFeatures), null, 2) + "\n"
);
