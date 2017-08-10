"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

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