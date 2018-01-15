"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Int = require("./int").Int;

var UnsignedInt = require("./unsigned-int").UnsignedInt;

var _lodash = require("lodash");

var all = _lodash.all;
var each = _lodash.each;
var times = _lodash.times;
var isArray = _lodash.isArray;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var VarArray = exports.VarArray = (function () {
  function VarArray(childType) {
    var maxLength = arguments[1] === undefined ? UnsignedInt.MAX_VALUE : arguments[1];

    _classCallCheck(this, VarArray);

    this._childType = childType;
    this._maxLength = maxLength;
  }

  _createClass(VarArray, {
    read: {
      value: function read(io) {
        var _this = this;

        var length = Int.read(io);

        if (length > this._maxLength) {
          throw new Error("XDR Read Error: Saw " + length + " length VarArray," + ("max allowed is " + this._maxLength));
        }

        return times(length, function () {
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

        if (value.length > this._maxLength) {
          throw new Error("XDR Write Error: Got array of size " + value.length + "," + ("max allowed is " + this._maxLength));
        }

        Int.write(value.length, io);
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
        if (value.length > this._maxLength) {
          return false;
        }

        return all(value, function (child) {
          return _this._childType.isValid(child);
        });
      }
    }
  });

  return VarArray;
})();

includeIoMixin(VarArray.prototype);