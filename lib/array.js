"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require("lodash");

var all = _lodash.all;
var each = _lodash.each;
var times = _lodash.times;
var isArray = _lodash.isArray;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Array = exports.Array = (function () {
  function Array(childType, length) {
    _classCallCheck(this, Array);

    this._childType = childType;
    this._length = length;
  }

  _createClass(Array, {
    read: {
      value: function read(io) {
        var _this = this;

        return times(this._length, function () {
          return _this._childType.read(io);
        });
      }
    },
    write: {
      value: function write(value, io) {
        var _this = this;

        if (!isArray(value)) {
          throw new Error("XDR Write Error: value is not array");
        }

        if (value.length !== this._length) {
          throw new Error("XDR Write Error: Got array of size " + value.length + "," + ("expected " + this._length));
        }

        each(value, function (child) {
          return _this._childType.write(child, io);
        });
      }
    },
    isValid: {
      value: function isValid(value) {
        var _this = this;

        if (!isArray(value)) {
          return false;
        }
        if (value.length !== this._length) {
          return false;
        }

        return all(value, function (child) {
          return _this._childType.isValid(child);
        });
      }
    }
  });

  return Array;
})();

includeIoMixin(Array.prototype);