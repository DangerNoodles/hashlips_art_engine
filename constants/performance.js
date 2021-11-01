"use strict";

const cpuLength = require("os").cpus().length;

if (cpuLength === 2) {
  console.log(
    "2 CPU cores detected. Only MAXIMUM setting will enable multiprocessing."
  );
}

const PERFORMANCE_OPTIONS = {
  ORIGINAL: 1,
  COMFORTABLE: cpuLength - 2,
  BACKGROUND: cpuLength - 1,
  MAXIMUM: cpuLength,
};

module.exports = {
  PERFORMANCE_OPTIONS,
};
