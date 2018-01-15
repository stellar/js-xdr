"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var isNumber = require("lodash").isNumber;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var UnsignedInt = {

  read: function read(io) {
    return io.readUInt32BE();
  },

  write: function write(value, io) {
    if (!isNumber(value)) {
      throw new Error("XDR Write Error: not a number");
    }

    if (Math.floor(value) !== value) {
      throw new Error("XDR Write Error: not an integer");
    }

    if (value < 0) {
      throw new Error("XDR Write Error: negative number " + value);
    }

    io.writeUInt32BE(value);
  },

  isValid: function isValid(value) {
    if (!isNumber(value)) {
      return false;
    }
    if (Math.floor(value) !== value) {
      return false;
    }

    return value >= UnsignedInt.MIN_VALUE && value <= UnsignedInt.MAX_VALUE;
  } };

exports.UnsignedInt = UnsignedInt;
UnsignedInt.MAX_VALUE = Math.pow(2, 32) - 1;
UnsignedInt.MIN_VALUE = 0;

includeIoMixin(UnsignedInt);