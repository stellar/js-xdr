"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Long = _interopRequire(require("long"));

var includeIoMixin = _interopRequire(require("./io-mixin"));

var UnsignedHyper = exports.UnsignedHyper = (function (_Long) {
  function UnsignedHyper(low, high) {
    _classCallCheck(this, UnsignedHyper);

    _get(_core.Object.getPrototypeOf(UnsignedHyper.prototype), "constructor", this).call(this, low, high, true);
  }

  _inherits(UnsignedHyper, _Long);

  _createClass(UnsignedHyper, null, {
    read: {
      value: function read(io) {
        var high = io.readInt32BE();
        var low = io.readInt32BE();
        return this.fromBits(low, high);
      }
    },
    write: {
      value: function write(value, io) {
        if (!(value instanceof this)) {
          throw new Error("XDR Write Error: " + value + " is not an UnsignedHyper");
        }

        io.writeInt32BE(value.high);
        io.writeInt32BE(value.low);
      }
    },
    fromString: {
      value: function fromString(string) {
        if (!/^\d+$/.test(string)) {
          throw new Error("Invalid hyper string: " + string);
        }
        var result = _get(_core.Object.getPrototypeOf(UnsignedHyper), "fromString", this).call(this, string, true);
        return new this(result.low, result.high);
      }
    },
    fromBits: {
      value: function fromBits(low, high) {
        var result = _get(_core.Object.getPrototypeOf(UnsignedHyper), "fromBits", this).call(this, low, high, true);
        return new this(result.low, result.high);
      }
    },
    isValid: {
      value: function isValid(value) {
        return value instanceof this;
      }
    }
  });

  return UnsignedHyper;
})(Long);

includeIoMixin(UnsignedHyper);

UnsignedHyper.MAX_VALUE = new UnsignedHyper(Long.MAX_UNSIGNED_VALUE.low, Long.MAX_UNSIGNED_VALUE.high);

UnsignedHyper.MIN_VALUE = new UnsignedHyper(Long.MIN_VALUE.low, Long.MIN_VALUE.high);