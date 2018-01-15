"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var isUndefined = require("lodash").isUndefined;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Void = {
  /* jshint unused: false */

  read: function read(io) {
    return undefined;
  },

  write: function write(value, io) {
    if (!isUndefined(value)) {
      throw new Error("XDR Write Error: trying to write value to a void slot");
    }
  },

  isValid: function isValid(value) {
    return isUndefined(value);
  } };

exports.Void = Void;
includeIoMixin(Void);