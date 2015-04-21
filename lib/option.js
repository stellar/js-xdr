"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Bool = require("./bool").Bool;

var _lodash = require("lodash");

var isNull = _lodash.isNull;
var isUndefined = _lodash.isUndefined;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Option = exports.Option = (function () {
  function Option(childType) {
    _classCallCheck(this, Option);

    this._childType = childType;
  }

  _createClass(Option, {
    read: {
      value: function read(io) {
        if (Bool.read(io)) {
          return this._childType.read(io);
        }
      }
    },
    write: {
      value: function write(value, io) {
        var isPresent = !(isNull(value) || isUndefined(value));

        Bool.write(isPresent, io);

        if (isPresent) {
          this._childType.write(value, io);
        }
      }
    },
    isValid: {
      value: function isValid(value) {
        if (isNull(value)) {
          return true;
        }
        if (isUndefined(value)) {
          return true;
        }

        return this._childType.isValid(value);
      }
    }
  });

  return Option;
})();

includeIoMixin(Option.prototype);