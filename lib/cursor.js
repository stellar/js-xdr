'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cursor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cursor = require('cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Cursor = exports.Cursor = function (_BaseCursor) {
  _inherits(Cursor, _BaseCursor);

  function Cursor() {
    _classCallCheck(this, Cursor);

    return _possibleConstructorReturn(this, (Cursor.__proto__ || Object.getPrototypeOf(Cursor)).apply(this, arguments));
  }

  _createClass(Cursor, [{
    key: 'writeBufferPadded',
    value: function writeBufferPadded(buffer) {
      var padding = (0, _util.calculatePadding)(buffer.length);
      var paddingBuffer = Buffer.alloc(padding);

      return this.copyFrom(new Cursor(buffer)).copyFrom(new Cursor(paddingBuffer));
    }
  }]);

  return Cursor;
}(_cursor2.default);