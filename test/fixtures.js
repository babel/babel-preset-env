import { join } from "path";
import testRunner from "babel-helper-transform-fixture-test-runner";

const fixturesDir = join(__dirname, "fixtures");

testRunner(fixturesDir, "babel-preset-env", {}, {}, (fixtureOptions, test) => {
  const presetOptions = fixtureOptions.presets[0][1];

  if (presetOptions.targets && presetOptions.targets.browserslistConfigPath) {
    const absolutePath = presetOptions.targets.browserslistConfigPath.replace("<fixture_path>", test.optionsDir);
    presetOptions.targets.browserslistConfigPath = absolutePath;
  }
});
