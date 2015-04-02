"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var isNumber = require("lodash").isNumber;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Double = {

  read: function read(io) {
    return io.readDoubleBE();
  },

  write: function write(value, io) {
    if (!isNumber(value)) {
      throw new Error("XDR Write Error: not a number");
    }

    io.writeDoubleBE(value);
  },

  isValid: function isValid(value) {
    return isNumber(value);
  } };

exports.Double = Double;
includeIoMixin(Double);