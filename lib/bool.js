"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Int = require("./int").Int;

var isBoolean = require("lodash").isBoolean;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Bool = {
  read: function read(io) {
    var value = Int.read(io);

    switch (value) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        throw new Error("XDR Read Error: Got " + value + " when trying to read a bool");
    }
  },

  write: function write(value, io) {
    var intVal = value ? 1 : 0;
    return Int.write(intVal, io);
  },

  isValid: function isValid(value) {
    return isBoolean(value);
  }
};

exports.Bool = Bool;
includeIoMixin(Bool);