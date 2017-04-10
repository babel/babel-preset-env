// @flow
import semver from "semver";

const DEFAULT_ENV = "development";
// Convert version to a semver value.
// 2.5 -> 2.5.0; 1 -> 1.0.0;
export const semverify = version => {
  if (typeof version === "string" && semver.valid(version)) {
    return version;
  }

  const split = version.toString().split(".");

  while (split.length < 3) {
    split.push(0);
  }

  return split.join(".");
};

export const desemverify = version => {
  return parseFloat(version);
};

export const prettifyVersion = version => {
  if (typeof version !== "string") {
    return version;
  }

  const parts = [semver.major(version)];
  const minor = semver.minor(version);
  const patch = semver.patch(version);

  if (minor || patch) {
    parts.push(minor);
  }

  if (patch) {
    parts.push(patch);
  }

  return parts.join(".");
};

export const prettifyTargets = (targets = {}) => {
  return Object.keys(targets).reduce(
    (results, target) => {
      let value = targets[target];

      if (typeof value === "string") {
        value = prettifyVersion(value);
      }

      results[target] = value;
      return results;
    },
    {},
  );
};

export const getEnv = env => {
  return env.BABEL_ENV || env.NODE_ENV || DEFAULT_ENV;
};

// const DEFAULT_ENV = "development";
// const filePathRe = /^(\.\w+)|(\w+\.\w+)$/;
// const patchSpecifiedRe = /^\d+\.\d+\.\d+$/;

// export const _extends = Object.assign || function (target) {
//   for (let i = 1; i < arguments.length; i++) {
//     const source = arguments[i];
//     for (const key in source) {
//       if (Object.prototype.hasOwnProperty.call(source, key)) {
//         target[key] = source[key];
//       }
//     }
//   }
//   return target;
// };

// /* Convert version to a semver value.
//   2.5 -> 2.5.0; 1 -> 1.0.0;
// */
// export const semverify = (version) => {
//   if (typeof version === "string" && patchSpecifiedRe.test(version)) {
//     return version;
//   }
//   const isInt = version % 1 === 0;
//   const stringified = version.toString();
//   const strEnd = isInt ? ".0.0" : ".0";
//   return stringified + strEnd;
// };

//  Convert semver value to a number.
//    Be careful when passing ranges! It's better to use `getLowestFromSemverValue` from config-utils.js

// export const desemverify = (version) => {
//   return parseFloat(version);
// };

// // Get current environment.

// /* Check passed argument includes filename.
//    Ex: ./.babelerc, /my/path/package.json
// */
// export const pathIsFile = (targetPath) => {
//   return filePathRe.test(targetPath);
// };

// /* Recline filename for the given path.
//    Ex: my/path/package.json -> my/path/
// */
// export const getDirnameInPath = (targetPath) => {
//   return targetPath.substring(0, targetPath.lastIndexOf("/") + 1);
// };

// /* Pick filename for the given path.
//    Ex: my/path/package.json -> package.json
// */
// export const getFilenameInPath = (targetPath) => {
//   return targetPath.substring(targetPath.lastIndexOf("/") + 1);
// };
