module.exports = {
  presets: [
    ["../../lib", {
      debug: true,
      targets: {
        ie: 11
      },
      onPresetBuild: ({ usedPolyfillsInFiles }) => {
        console.log(
          "`onPresetBuild` received following `usedPolyfillsInFiles`:\n ",
          JSON.stringify(Array.from(usedPolyfillsInFiles), 2)
        );
      },
      useBuiltIns: "usage"
    }]
  ]
}
