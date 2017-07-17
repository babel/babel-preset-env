import sortedIndexBy from "lodash.sortedindexby";
import browserslist from "browserslist";
import semver from "semver";
import { semverify } from "./utils";

const browserNameMap = {
  android: "android",
  chrome: "chrome",
  and_chr: "chrome",
  edge: "edge",
  firefox: "firefox",
  ie: "ie",
  ios_saf: "ios",
  safari: "safari",
};

const isBrowsersQueryValid = (browsers) =>
  typeof browsers === "string" || Array.isArray(browsers);

const semverMin = (first, second) => {
  return first && semver.lt(first, second) ? first : second;
};

const getLowestVersions = (browsers) => {
  return browsers.reduce(
    (all, browser) => {
      const [browserName, browserVersion] = browser.split(" ");
      const normalizedBrowserName = browserNameMap[browserName];

      if (!normalizedBrowserName) {
        return all;
      }

      try {
        // Browser version can return as "10.0-10.2"
        const splitVersion = browserVersion.split("-")[0];
        const parsedBrowserVersion = semverify(splitVersion);

        all[normalizedBrowserName] = semverMin(
          all[normalizedBrowserName],
          parsedBrowserVersion,
        );
      } catch (e) {}

      return all;
    },
    {},
  );
};

const outputDecimalWarning = (decimalTargets) => {
  if (!decimalTargets || !decimalTargets.length) {
    return;
  }

  console.log("Warning, the following targets are using a decimal version:");
  console.log("");
  decimalTargets.forEach(({ target, value }) =>
    console.log(`  ${target}: ${value}`));
  console.log("");
  console.log(
    "We recommend using a string for minor/patch versions to avoid numbers like 6.10",
  );
  console.log("getting parsed as 6.1, which can lead to unexpected behavior.");
  console.log("");
};

const supportedNodeVersions = [
  [new Date(2018, 4, 0), semverify("4")],
  [new Date(2019, 4, 0), semverify("6")],
  [new Date(2019, 12, 0), semverify("8")],
  [new Date(2021, 4, 0), semverify("10")],
  [Infinity, semverify("12")],
];

function getSupportedNode(date) {
  const index = sortedIndexBy(supportedNodeVersions, [date], (v) => v[0]);
  return supportedNodeVersions[index];
}

const targetParserMap = {
  __default: (target, value) => [target, semverify(value)],

  // Parse `node: true` and `node: "current"` to version
  node: (target, value) => {
    const parsed = (() => {
      switch (value) {
        case true:
        case "current": return process.versions.node;
        case "maintained": return getSupportedNode(new Date());
        default: return semverify(value);
      }
    })();

    return [target, parsed];
  },

  // Only valid value for Uglify is `true`
  uglify: (target, value) => [target, value === true],
};

const getTargets = (targets = {}) => {
  let targetOpts = {};

  // Parse browsers target via browserslist
  if (isBrowsersQueryValid(targets.browsers)) {
    targetOpts = getLowestVersions(browserslist(targets.browsers));
  }

  // Parse remaining targets
  const parsed = Object.keys(targets).reduce(
    (results, target) => {
      if (target !== "browsers") {
        const value = targets[target];

        // Warn when specifying minor/patch as a decimal
        if (typeof value === "number" && value % 1 !== 0) {
          results.decimalWarnings.push({ target, value });
        }

        // Check if we have a target parser?
        const parser = targetParserMap[target] || targetParserMap.__default;
        const [parsedTarget, parsedValue] = parser(target, value);

        if (parsedValue) {
          results.targets[parsedTarget] = parsedValue;
        }
      }

      return results;
    },
    {
      targets: targetOpts,
      decimalWarnings: [],
    },
  );

  outputDecimalWarning(parsed.decimalWarnings);

  return parsed.targets;
};

export default getTargets;
