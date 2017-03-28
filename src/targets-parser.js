import browserslist from "browserslist";
import semver from "semver";
import { semverify } from "./utils";

const browserNameMap = {
  chrome: "chrome",
  edge: "edge",
  firefox: "firefox",
  ie: "ie",
  ios_saf: "ios",
  safari: "safari",
};

const isBrowsersQueryValid = browsers =>
  typeof browsers === "string" || Array.isArray(browsers);

const semverMin = (first, second) => {
  return first && semver.lt(first, second) ? first : second;
};

const getLowestVersions = browsers => {
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

const targetParserMap = {
  __default: (target, value) => [target, semverify(value)],

  // Parse `node: true` and `node: "current"` to version
  node: (target, value) => {
    const parsed = value === true || value === "current"
      ? process.versions.node
      : semverify(value);

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
  return Object.keys(targets).reduce(
    (results, target) => {
      if (target !== "browsers") {
        const value = targets[target];

        // Check if we have a target parser?
        const parser = targetParserMap[target] || targetParserMap.__default;
        const [parsedTarget, parsedValue] = parser(target, value);

        if (parsedValue) {
          // Merge (lowest wins)
          if (typeof parsedValue === "string") {
            results[parsedTarget] = semverMin(
              results[parsedTarget],
              parsedValue,
            );
          } else {
            // We can remove this block if/when we replace Uglify target
            // with top level option
            results[parsedTarget] = parsedValue;
          }
        }
      }

      return results;
    },
    targetOpts,
  );
};

export default getTargets;
