"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var isNumber = require("lodash").isNumber;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Int = {

  read: function read(io) {
    return io.readInt32BE();
  },

  write: function write(value, io) {
    if (!isNumber(value)) {
      throw new Error("XDR Write Error: not a number");
    }

    if (Math.floor(value) !== value) {
      throw new Error("XDR Write Error: not an integer");
    }

    io.writeInt32BE(value);
  },

  isValid: function isValid(value) {
    if (!isNumber(value)) {
      return false;
    }
    if (Math.floor(value) !== value) {
      return false;
    }

    return value >= Int.MIN_VALUE && value <= Int.MAX_VALUE;
  } };

exports.Int = Int;
Int.MAX_VALUE = Math.pow(2, 31) - 1;
Int.MIN_VALUE = -Math.pow(2, 31);

includeIoMixin(Int);