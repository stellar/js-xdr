"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require("lodash");

var each = _lodash.each;
var isUndefined = _lodash.isUndefined;
var cloneDeep = _lodash.cloneDeep;

var Void = require("./void").Void;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Union = exports.Union = (function () {
  function Union(aSwitch, value) {
    _classCallCheck(this, Union);

    this.set(aSwitch, value);
  }

  _createClass(Union, {
    set: {
      value: function set(aSwitch, value) {
        if (!(aSwitch instanceof this.constructor._switchOn)) {
          aSwitch = this.constructor._switchOn.fromName(aSwitch);
        }

        this._switch = aSwitch;
        this._arm = this.constructor.armForSwitch(this._switch);
        this._armType = this.constructor.armTypeForArm(this._arm);
        this._value = value;
      }
    },
    get: {
      value: function get() {
        var armName = arguments[0] === undefined ? this._arm : arguments[0];

        if (this._arm !== Void && this._arm !== armName) {
          throw new Error("" + armName + " not set");
        }
        return this._value;
      }
    },
    "switch": {
      value: function _switch() {
        return this._switch;
      }
    },
    arm: {
      value: function arm() {
        return this._arm;
      }
    },
    armType: {
      value: function armType() {
        return this._armType;
      }
    },
    value: {
      value: function value() {
        return this._value;
      }
    }
  }, {
    armForSwitch: {
      value: function armForSwitch(aSwitch) {

        var arm = this._switches.get(aSwitch);

        if (isUndefined(arm)) {
          throw new Error("Bad union switch: " + aSwitch);
        }

        return arm;
      }
    },
    armTypeForArm: {
      value: function armTypeForArm(arm) {
        if (arm === Void) {
          return Void;
        } else {
          return this._arms[arm];
        }
      }
    },
    read: {
      value: function read(io) {
        var aSwitch = this._switchOn.read(io);
        var arm = this.armForSwitch(aSwitch);
        var armType = this.armTypeForArm(arm);
        var value = armType.read(io);
        return new this(aSwitch, value);
      }
    },
    write: {
      value: function write(value, io) {
        if (!(value instanceof this)) {
          throw new Error("XDR Write Error: " + value + " is not a " + this.unionName);
        }

        this._switchOn.write(value["switch"](), io);
        value.armType().write(value.value(), io);
      }
    },
    isValid: {
      value: function isValid(value) {
        return value instanceof this;
      }
    },
    create: {
      value: function create(name, config) {
        var ChildUnion = (function (_Union) {
          var _class = function ChildUnion() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            _classCallCheck(this, _class);

            _get(Object.getPrototypeOf(_class.prototype), "constructor", this).apply(this, args);
          };

          _inherits(_class, _Union);

          return _class;
        })(Union);

        ChildUnion.unionName = name;
        ChildUnion._switchOn = config.switchOn;
        ChildUnion._switches = new Map();
        ChildUnion._arms = cloneDeep(config.arms);

        each(ChildUnion._switchOn.values(), function (aSwitch) {

          // build the enum => arm map
          var arm = config.switches[aSwitch.name] || config.defaultArm;
          ChildUnion._switches.set(aSwitch, arm);

          // Add enum-based constrocutors
          ChildUnion[aSwitch.name] = function (value) {
            return new ChildUnion(aSwitch, value);
          };

          // Add enum-based "set" helpers
          ChildUnion.prototype[aSwitch.name] = function (value) {
            return this.set(aSwitch, value);
          };
        });

        // Add arm accessor helpers
        each(ChildUnion._arms, function (type, name) {
          if (type === Void) {
            return;
          }

          ChildUnion.prototype[name] = function () {
            return this.get(name);
          };
        });

        return ChildUnion;
      }
    }
  });

  return Union;
})();

includeIoMixin(Union);