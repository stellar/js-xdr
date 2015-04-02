"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
require("babel/polyfill");

_defaults(exports, _interopRequireWildcard(require("./types")));

var _define = require("./define");

_defaults(exports, _interopRequireWildcard(_define));

var define = _define.define;

exports["default"] = function (fn) {
  return define(fn);
};