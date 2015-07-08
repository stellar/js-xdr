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
var isUndefined = _lodash.isUndefined;
var isString = _lodash.isString;

var Void = require("./void").Void;

var Reference = require("./config").Reference;

var includeIoMixin = _interopRequire(require("./io-mixin"));

var Union = exports.Union = (function () {
  function Union(aSwitch, value) {
    _classCallCheck(this, Union);

    this.set(aSwitch, value);
  }

  _createClass(Union, {
    set: {
      value: function set(aSwitch, value) {
        if (isString(aSwitch)) {
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
        if (this._switches.has(aSwitch)) {
          return this._switches.get(aSwitch);
        } else if (this._defaultArm) {
          return this._defaultArm;
        } else {
          throw new Error("Bad union switch: " + aSwitch);
        }
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
      value: function create(context, name, config) {
        var ChildUnion = (function (_Union) {
          var _class = function ChildUnion() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            _classCallCheck(this, _class);

            _get(_core.Object.getPrototypeOf(_class.prototype), "constructor", this).apply(this, args);
          };

          _inherits(_class, _Union);

          return _class;
        })(Union);

        ChildUnion.unionName = name;
        context.results[name] = ChildUnion;

        if (config.switchOn instanceof Reference) {
          ChildUnion._switchOn = config.switchOn.resolve(context);
        } else {
          ChildUnion._switchOn = config.switchOn;
        }

        ChildUnion._switches = new _core.Map();
        ChildUnion._arms = {};

        each(config.arms, function (value, name) {
          if (value instanceof Reference) {
            value = value.resolve(context);
          }

          ChildUnion._arms[name] = value;
        });

        // resolve default arm
        var defaultArm = config.defaultArm;
        if (defaultArm instanceof Reference) {
          defaultArm = defaultArm.resolve(context);
        }

        ChildUnion._defaultArm = defaultArm;

        each(config.switches, function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);

          var aSwitch = _ref2[0];
          var armName = _ref2[1];

          if (isString(aSwitch)) {
            aSwitch = ChildUnion._switchOn.fromName(aSwitch);
          }

          ChildUnion._switches.set(aSwitch, armName);
        });

        // add enum-based helpers
        // NOTE: we don't have good notation for "is a subclass of XDR.Enum",
        //  and so we use the following check (does _switchOn have a `values`
        //  attribute) to approximate the intent.
        if (!isUndefined(ChildUnion._switchOn.values)) {
          each(ChildUnion._switchOn.values(), function (aSwitch) {
            // Add enum-based constrocutors
            ChildUnion[aSwitch.name] = function (value) {
              return new ChildUnion(aSwitch, value);
            };

            // Add enum-based "set" helpers
            ChildUnion.prototype[aSwitch.name] = function (value) {
              return this.set(aSwitch, value);
            };
          });
        }

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