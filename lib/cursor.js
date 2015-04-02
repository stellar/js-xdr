"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var BaseCursor = _interopRequire(require("cursor"));

var calculatePadding = require("./util").calculatePadding;

var Cursor = exports.Cursor = (function (_BaseCursor) {
  function Cursor() {
    _classCallCheck(this, Cursor);

    if (_BaseCursor != null) {
      _BaseCursor.apply(this, arguments);
    }
  }

  _inherits(Cursor, _BaseCursor);

  _createClass(Cursor, {
    writeBufferPadded: {
      value: function writeBufferPadded(buffer) {
        var padding = calculatePadding(buffer.length);
        var paddingBuffer = new Buffer(padding);
        paddingBuffer.fill(0);

        return this.copyFrom(new Cursor(buffer)).copyFrom(new Cursor(paddingBuffer));
      }
    }
  });

  return Cursor;
})(BaseCursor);