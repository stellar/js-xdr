"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require("./util");

var calculatePadding = _util.calculatePadding;
var slicePadding = _util.slicePadding;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Opaque = exports.Opaque = (function () {
  function Opaque(length) {
    _classCallCheck(this, Opaque);

    this._length = length;
    this._padding = calculatePadding(length);
  }

  _createClass(Opaque, {
    read: {
      value: function read(io) {
        var result = io.slice(this._length);
        slicePadding(io, this._padding);
        return result.buffer();
      }
    },
    write: {
      value: function write(value, io) {
        if (value.length !== this._length) {
          throw new Error("XDR Write Error: Got " + value.length + " bytes, expected " + this._length);
        }

        io.writeBufferPadded(value);
      }
    },
    isValid: {
      value: function isValid(value) {
        return Buffer.isBuffer(value) && value.length === this._length;
      }
    }
  });

  return Opaque;
})();

includeIoMixin(Opaque.prototype);