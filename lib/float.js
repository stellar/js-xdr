"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var isNumber = require("lodash").isNumber;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Float = {

  read: function read(io) {
    return io.readFloatBE();
  },

  write: function write(value, io) {
    if (!isNumber(value)) {
      throw new Error("XDR Write Error: not a number");
    }

    io.writeFloatBE(value);
  },

  isValid: function isValid(value) {
    return isNumber(value);
  } };

exports.Float = Float;
includeIoMixin(Float);