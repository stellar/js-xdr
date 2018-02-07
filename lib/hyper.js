"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Long = _interopRequire(require("long"));

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Hyper = exports.Hyper = (function (_Long) {
  function Hyper(low, high) {
    _classCallCheck(this, Hyper);

    _get(Object.getPrototypeOf(Hyper.prototype), "constructor", this).call(this, low, high, false);
  }

  _inherits(Hyper, _Long);

  _createClass(Hyper, null, {
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
          throw new Error("XDR Write Error: " + value + " is not a Hyper");
        }

        io.writeInt32BE(value.high);
        io.writeInt32BE(value.low);
      }
    },
    fromString: {
      value: function fromString(string) {
        if (!/^-?\d+$/.test(string)) {
          throw new Error("Invalid hyper string: " + string);
        }
        var result = _get(Object.getPrototypeOf(Hyper), "fromString", this).call(this, string, false);
        return new this(result.low, result.high);
      }
    },
    fromBits: {
      value: function fromBits(low, high) {
        var result = _get(Object.getPrototypeOf(Hyper), "fromBits", this).call(this, low, high, false);
        return new this(result.low, result.high);
      }
    },
    isValid: {
      value: function isValid(value) {
        return value instanceof this;
      }
    }
  });

  return Hyper;
})(Long);

includeIoMixin(Hyper);

Hyper.MAX_VALUE = new Hyper(Long.MAX_VALUE.low, Long.MAX_VALUE.high);
Hyper.MIN_VALUE = new Hyper(Long.MIN_VALUE.low, Long.MIN_VALUE.high);