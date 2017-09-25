/*eslint quotes: ["error", "double", { "avoidEscape": true }]*/
import semver from "semver";
import { prettifyVersion, semverify, isUnreleasedVersion } from "./utils";

const wordEnds = size => {
  return size > 1 ? "s" : "";
};

const envIsNotSupported = (fromEnvs, fromTargets) =>
  !fromEnvs || semver.lt(fromTargets, semverify(fromEnvs));

export const logMessage = (message, context) => {
  const pre = context ? `[${context}] ` : "";
  const logStr = `  ${pre}${message}`;
  console.log(logStr);
};

export const logPlugin = (plugin, targets, list, context) => {
  const envList = list[plugin] || {};
  const filteredList = Object.keys(targets).reduce((a, b) => {
    const isUnreleased = isUnreleasedVersion(targets[b], b);

    if (!isUnreleased && envIsNotSupported(envList[b], targets[b])) {
      a[b] = prettifyVersion(targets[b]);
    }

    return a;
  }, {});

  const formattedTargets = JSON.stringify(filteredList)
    .replace(/\,/g, ", ")
    .replace(/^\{\"/, '{ "')
    .replace(/\"\}$/, '" }');

  logMessage(`${plugin} ${formattedTargets}`, context);
};

export const logEntryPolyfills = (
  importPolyfillIncluded,
  polyfills,
  filename,
  onDebug,
) => {
  if (!importPolyfillIncluded) {
    console.log(
      `
[${filename}] \`import 'babel-polyfill'\` was not found.`,
    );
    return;
  }
  if (!polyfills.size) {
    console.log(
      `
[${filename}] Based on your targets, none were added.`,
    );
    return;
  }

  console.log(
    `
[${filename}] Replaced \`babel-polyfill\` with the following polyfill${wordEnds(
      polyfills.size,
    )}:`,
  );
  onDebug(polyfills);
};

export const logUsagePolyfills = (polyfills, filename, onDebug) => {
  if (!polyfills.size) {
    console.log(
      `
[${filename}] Based on your code and targets, none were added.`,
    );
    return;
  }
  console.log(
    `
[${filename}] Added following polyfill${wordEnds(polyfills.size)}:`,
  );
  onDebug(polyfills);
};
