"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Quadruple = {
  /* jshint unused: false */

  read: function read(io) {
    throw new Error("XDR Read Error: quadruple not supported");
  },

  write: function write(value, io) {
    throw new Error("XDR Write Error: quadruple not supported");
  },

  isValid: function isValid(value) {
    return false;
  } };

exports.Quadruple = Quadruple;
includeIoMixin(Quadruple);