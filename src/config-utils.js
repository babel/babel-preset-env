import semver from "semver";
import path from "path";
import {
  pathIsFile,
  getDirnameInPath,
  getFilenameInPath,
  getEnv,
  semverify,
  desemverify,
} from "./utils";
import pluginList from "../data/plugins.json";
import builtInsList from "../data/built-ins.json";

/* Resolving path depending on what type of path was passed (directory or file).
   ../confg/ -> ../confg/package.json
   ./index.js -> ./package.json */
const resolvePackagePath = (packagePath = "") => {
  if (pathIsFile(packagePath)) {
    if (getFilenameInPath(packagePath) !== "package.json") {
      packagePath = getDirnameInPath(packagePath);
    }
  }
  return path.join(process.cwd(), packagePath, "package.json");
};

/* Filter versions that satisfiyng to passed semver range.
   Ex: 5.5 satisfies ^5.0, 1.0.1 satisfies >= 1.0 */
const filterSatisfiedVersions = (range, versions) => {
  return versions.filter(targ => semver.satisfies(targ, range));
};

const getVersionsFromList = list => {
  // console.log(list)
  return Object.keys(list).reduce(
    (allVersions, currentItem) => {
      const currentVersions = list[currentItem];
      for (let envName in currentVersions) {
        const currentVersion = allVersions[envName];
        const envVersion = currentVersions[envName];

        if (!currentVersion) {
          allVersions[envName] = [envVersion];
        } else if (currentVersion.indexOf(envVersion) === -1) {
          allVersions[envName].push(envVersion);
        }
      }

      for (let env in allVersions) {
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
    return desemverify(version);
  } else if (semver.validRange(version)) {
    const versions = versionsList.map(semverify);
    const allSupported = filterSatisfiedVersions(version, versions);
    if (allSupported.length) {
      return desemverify(allSupported[0]);
    }
  }
  return null;
};

/* Try to access `package.json` with passed path.
   If can't - logs (but doesn't throw) an error. */
export const getPackageJSON = packagePath => {
  const pkgPath = resolvePackagePath(packagePath);

  try {
    const pkg = require(pkgPath);
    return pkg;
  } catch (e) {
    console.warn(`Can't parse package.json in ${pkgPath}: `, e);
  }
};

/* Gives `package.json` path and all versions to consider and
   returns engines/devEngines version or `null`.
   `null` means support all node.js versions. */
export const getEnginesNodeVersion = packagePath => {
  const env = getEnv(process.env);
  const pkg = getPackageJSON(packagePath);
  const engines = (env === "development" && pkg.devEngines) || pkg.engines;

  if (engines && engines.node) {
    const semverVersion = engines.node;
    const versions = versionsFromData[env].map(semverify);
    pluginList, builtInsList;
    const allVersions = getVersionsFromList({ ...pluginList, ...builtInsList });
    return getLowestFromSemverValue(semverVersion, allVersions["node"]);
  }
  return null;
};
