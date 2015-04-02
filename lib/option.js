"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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