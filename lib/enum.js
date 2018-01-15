"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Int = require("./int").Int;

var _lodash = require("lodash");

var each = _lodash.each;
var vals = _lodash.values;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Enum = exports.Enum = (function () {
  function Enum(name, value) {
    _classCallCheck(this, Enum);

    this.name = name;
    this.value = value;
  }

  _createClass(Enum, null, {
    read: {
      value: function read(io) {
        var intVal = Int.read(io);

        if (!this._byValue.has(intVal)) {
          throw new Error("XDR Read Error: Unknown " + this.enumName + " member for value " + intVal);
        }

        return this._byValue.get(intVal);
      }
    },
    write: {
      value: function write(value, io) {
        if (!(value instanceof this)) {
          throw new Error("XDR Write Error: Unknown " + value + " is not a " + this.enumName);
        }

        Int.write(value.value, io);
      }
    },
    isValid: {
      value: function isValid(value) {
        return value instanceof this;
      }
    },
    members: {
      value: function members() {
        return this._members;
      }
    },
    values: {
      value: function values() {
        return vals(this._members);
      }
    },
    fromName: {
      value: function fromName(name) {
        var result = this._members[name];

        if (!result) {
          throw new Error("" + name + " is not a member of " + this.enumName);
        }

        return result;
      }
    },
    create: {
      value: function create(context, name, members) {
        var ChildEnum = (function (_Enum) {
          var _class = function ChildEnum() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            _classCallCheck(this, _class);

            _get(Object.getPrototypeOf(_class.prototype), "constructor", this).apply(this, args);
          };

          _inherits(_class, _Enum);

          return _class;
        })(Enum);

        ChildEnum.enumName = name;
        context.results[name] = ChildEnum;

        ChildEnum._members = {};
        ChildEnum._byValue = new Map();

        each(members, function (value, key) {
          var inst = new ChildEnum(key, value);
          ChildEnum._members[key] = inst;
          ChildEnum._byValue.set(value, inst);
          ChildEnum[key] = function () {
            return inst;
          };
        });

        return ChildEnum;
      }
    }
  });

  return Enum;
})();

includeIoMixin(Enum);