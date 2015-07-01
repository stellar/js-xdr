"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require("lodash");

var each = _lodash.each;
var map = _lodash.map;
var isUndefined = _lodash.isUndefined;
var zipObject = _lodash.zipObject;

var Reference = require("./config").Reference;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Struct = exports.Struct = (function () {
  function Struct(attributes) {
    _classCallCheck(this, Struct);

    this._attributes = attributes || {};
  }

  _createClass(Struct, null, {
    read: {
      value: function read(io) {
        var fields = map(this._fields, function (field) {
          var _field = _slicedToArray(field, 2);

          var name = _field[0];
          var type = _field[1];

          var value = type.read(io);
          return [name, value];
        });

        return new this(zipObject(fields));
      }
    },
    write: {
      value: function write(value, io) {
        if (!(value instanceof this)) {
          throw new Error("XDR Write Error: " + value + " is not a " + this.structName);
        }
        each(this._fields, function (field) {
          var _field = _slicedToArray(field, 2);

          var name = _field[0];
          var type = _field[1];

          var attribute = value._attributes[name];
          type.write(attribute, io);
        });
      }
    },
    isValid: {
      value: function isValid(value) {
        return value instanceof this;
      }
    },
    create: {
      value: function create(context, name, fields) {
        var ChildStruct = (function (_Struct) {
          var _class = function ChildStruct() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            _classCallCheck(this, _class);

            _get(_core.Object.getPrototypeOf(_class.prototype), "constructor", this).apply(this, args);
          };

          _inherits(_class, _Struct);

          return _class;
        })(Struct);

        ChildStruct.structName = name;

        context.results[name] = ChildStruct;

        ChildStruct._fields = fields.map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);

          var name = _ref2[0];
          var field = _ref2[1];

          if (field instanceof Reference) {
            field = field.resolve(context);
          }

          return [name, field];
        });

        each(ChildStruct._fields, function (field) {
          var _field = _slicedToArray(field, 1);

          var fieldName = _field[0];

          ChildStruct.prototype[fieldName] = readOrWriteAttribute(fieldName);
        });

        return ChildStruct;
      }
    }
  });

  return Struct;
})();

includeIoMixin(Struct);

function readOrWriteAttribute(name) {
  return function (value) {
    if (!isUndefined(value)) {
      this._attributes[name] = value;
    }

    return this._attributes[name];
  };
}