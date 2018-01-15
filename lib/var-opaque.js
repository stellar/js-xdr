"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Int = require("./int").Int;

var UnsignedInt = require("./unsigned-int").UnsignedInt;

var _util = require("./util");

var calculatePadding = _util.calculatePadding;
var slicePadding = _util.slicePadding;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var VarOpaque = exports.VarOpaque = (function () {
  function VarOpaque() {
    var maxLength = arguments[0] === undefined ? UnsignedInt.MAX_VALUE : arguments[0];

    _classCallCheck(this, VarOpaque);

    this._maxLength = maxLength;
  }

  _createClass(VarOpaque, {
    read: {
      value: function read(io) {
        var length = Int.read(io);

        if (length > this._maxLength) {
          throw new Error("XDR Read Error: Saw " + length + " length VarOpaque," + ("max allowed is " + this._maxLength));
        }
        var padding = calculatePadding(length);
        var result = io.slice(length);
        slicePadding(io, padding);
        return result.buffer();
      }
    },
    write: {
      value: function write(value, io) {
        if (value.length > this._maxLength) {
          throw new Error("XDR Write Error: Got " + value.length + " bytes," + ("max allows is " + this._maxLength));
        }
        Int.write(value.length, io);
        io.writeBufferPadded(value);
      }
    },
    isValid: {
      value: function isValid(value) {
        return Buffer.isBuffer(value) && value.length <= this._maxLength;
      }
    }
  });

  return VarOpaque;
})();

includeIoMixin(VarOpaque.prototype);