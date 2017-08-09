"use strict";

exports.calculatePadding = calculatePadding;
exports.slicePadding = slicePadding;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var all = require("lodash").all;

function calculatePadding(length) {
  switch (length % 4) {
    case 0:
      return 0;
    case 1:
      return 3;
    case 2:
      return 2;
    case 3:
      return 1;
  }
}

function slicePadding(io, length) {
  var padding = io.slice(length);
  var allZero = all(padding.buffer(), function (byte) {
    return byte === 0;
  });

  if (allZero !== true) {
    throw new Error("XDR Read Error: invalid padding");
  }
}