"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

            _get(Object.getPrototypeOf(_class.prototype), "constructor", this).apply(this, args);
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