import semver from "semver";
import path from "path";
import fs from "fs";
import { getEnv, semverify } from "./utils";
import pluginList from "../data/plugins.json";
import builtInsList from "../data/built-ins.json";

/* Resolving path depending on what type of path was passed (directory or file).
   ../confg/ -> ../confg/package.json
   ./index.js -> ./package.json */
const resolvePackagePath = (packagePath = "") => {
  return path.join(packagePath, "package.json");
};

// Just check wether the file exist.
export const fileExist = file =>
  fs.existsSync(file) && fs.statSync(file).isFile();

const eachParent = (file, callback) => {
  if (!file) return undefined;
  let loc = path.resolve(file);
  do {
    const result = callback(loc);
    if (typeof result !== "undefined") return result;
  } while (loc !== (loc = path.dirname(loc)));
  return undefined;
};

const parsePackage = path => JSON.parse(fs.readFileSync(path));

export const findPackageRecursively = entry => {
  return eachParent(entry, dir => {
    const pkg = resolvePackagePath(dir, "package.json");

    if (fileExist(pkg)) {
      try {
        return parsePackage(pkg);
      } catch (e) {
        console.warn("Can't parse " + pkg + ".");
      }
    }
  });
};

/* Filter versions that satisfiyng to passed semver range.
   Ex: 5.5 satisfies ^5.0, 1.0.1 satisfies >= 1.0 */
const filterSatisfiedVersions = (range, versions) => {
  return versions.filter(targ => semver.satisfies(targ, range));
};

const getVersionsFromList = list => {
  return Object.keys(list).reduce(
    (allVersions, currentItem) => {
      const currentVersions = list[currentItem];
      for (const envName in currentVersions) {
        const currentVersion = allVersions[envName];
        const envVersion = currentVersions[envName];

        if (!currentVersion) {
          allVersions[envName] = [envVersion];
        } else if (currentVersion.indexOf(envVersion) === -1) {
          allVersions[envName].push(envVersion);
        }
      }

      for (const env in allVersions) {
        allVersions[env].sort((a, b) => a - b);
      }

      return allVersions;
    },
    {},
  );
};

/* First, it checks whether passed version is a wildcat, a range or a simple string
   - For wildcats(*) returs null. It means all node versions are matched.
   - For versions in a simple string format (2.0) it converts it to the number.
   - For ranged values (^4.5, ~2.1.0) it checks all versions we must support and returns lowest from the list.
*/
export const getLowestFromSemverValue = (version, versionsList) => {
  if (version === "*") {
    return null;
  }

  if (semver.valid(version)) {
    return version;
  } else if (semver.validRange(version)) {
    const versions = versionsList.map(semverify);
    const allSupported = filterSatisfiedVersions(version, versions);
    if (allSupported.length) {
      return allSupported[0];
    }
  }
  return null;
};

/* Try to access `package.json` with passed path.
   If can't - logs (but doesn't throw) an error. */
export const getPackageJSON = packagePath => {
  try {
    return findPackageRecursively(packagePath);
  } catch (e) {
    console.warn(`Can't parse package.json in ${pkgPath}: `, e);
  }
};

/* Gives `package.json` path and all versions to consider and
   returns engines/devEngines version or `null`.
   `null` means support all node.js versions. */
export const getEnginesNodeVersion = (packagePath, useBuiltIns) => {
  const env = getEnv(process.env);
  const pkg = getPackageJSON(packagePath);
  if (!pkg) return null;
  const engines = (env === "development" && pkg.devEngines) || pkg.engines;

  if (engines && engines.node) {
    const semverVersion = engines.node;

    const list = [pluginList];
    if (useBuiltIns) {
      list.push(builtInsList);
    }

    const allSupportedVersions = getVersionsFromList(
      Object.assign({}, ...list),
    );

    return getLowestFromSemverValue(
      semverVersion,
      allSupportedVersions["node"],
    );
  }
  return null;
};
