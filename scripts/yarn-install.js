"use strict";

const { exec } = require("child_process");

// function to check if yarn is installed globally
const runIfYarn = fn => {
  exec("yarn -V", error => {
    if (error === null) fn();
  });
};

const yarn = () => {
  console.log("`package.json` was changed. Running yarn...🐈");
  exec("yarn");
};

runIfYarn(yarn);
