"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.define = define;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var XDR = _interopRequireWildcard(require("./types"));

var _lodash = require("lodash");

var isUndefined = _lodash.isUndefined;
var isPlainObject = _lodash.isPlainObject;
var isArray = _lodash.isArray;
var each = _lodash.each;
var map = _lodash.map;
var pick = _lodash.pick;

var sequencify = _interopRequire(require("sequencify"));

// types is the root
var types = {};

function define(fn) {
  if (fn) {
    var builder = new TypeBuilder(types);
    fn(builder);
    builder.resolve();
  }

  return types;
}

var Reference = (function () {
  function Reference() {
    _classCallCheck(this, Reference);
  }

  _createClass(Reference, {
    resolve: {
      /* jshint unused: false */

      value: function resolve(definitions) {
        throw new Error("implement resolve in child class");
      }
    }
  });

  return Reference;
})();

var SimpleReference = (function (_Reference) {
  function SimpleReference(name) {
    _classCallCheck(this, SimpleReference);

    this.name = name;
  }

  _inherits(SimpleReference, _Reference);

  _createClass(SimpleReference, {
    resolve: {
      value: function resolve(definitions) {
        return definitions[this.name];
      }
    }
  });

  return SimpleReference;
})(Reference);

var ArrayReference = (function (_Reference2) {
  function ArrayReference(childReference, length) {
    var variable = arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, ArrayReference);

    this.childReference = childReference;
    this.length = length;
    this.variable = variable;
    this.name = childReference.name;
  }

  _inherits(ArrayReference, _Reference2);

  _createClass(ArrayReference, {
    resolve: {
      value: function resolve(definitions) {
        var resolvedChild = this.childReference.resolve(definitions);
        if (this.variable) {
          return new XDR.VarArray(resolvedChild, this.length);
        } else {
          return new XDR.Array(resolvedChild, this.length);
        }
      }
    }
  });

  return ArrayReference;
})(Reference);

var OptionReference = (function (_Reference3) {
  function OptionReference(childReference) {
    _classCallCheck(this, OptionReference);

    this.childReference = childReference;
    this.name = childReference.name;
  }

  _inherits(OptionReference, _Reference3);

  _createClass(OptionReference, {
    resolve: {
      value: function resolve(definitions) {
        var resolvedChild = this.childReference.resolve(definitions);
        return new XDR.Option(resolvedChild);
      }
    }
  });

  return OptionReference;
})(Reference);

var Definition = (function () {
  function Definition(constructor, name) {
    var _this = this;

    for (var _len = arguments.length, config = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      config[_key - 2] = arguments[_key];
    }

    _classCallCheck(this, Definition);

    this.constructor = constructor;
    this.name = name;
    this.config = config;
    this.dep = [];

    // walk the defintion config for Reference objects, push their names onto
    // this.deps so we can use sequencify to order our resolutions
    this._walkConfig(this.config, function (value) {
      if (value instanceof Reference) {
        _this.dep.push(value.name);
      }
    });
  }

  _createClass(Definition, {
    create: {
      value: function create(deps) {
        this._walkConfig(this.config, function (value, key, parent) {
          if (!(value instanceof Reference)) {
            return;
          }

          var dep = value.resolve(deps);

          if (!dep) {
            // throw if the reference couldn't be resolved
            throw new Error("XDR Error:" + value.name + " could not be resolved.");
          } else {
            // overwrite the reference with the concrete value
            parent[key] = dep;
          }
        });

        // actually create the concrete definition
        return this.constructor.apply(this, [this.name].concat(_toConsumableArray(this.config)));
      }
    },
    _walkConfig: {
      value: function _walkConfig(current, fn) {
        var _this = this;

        each(current, function (value, key) {
          fn(value, key, current);

          // recurse if the value is a nested object
          if (isPlainObject(value) || isArray(value)) {
            _this._walkConfig(value, fn);
          }
        });
      }
    }
  });

  return Definition;
})();

var TypeBuilder = (function () {
  function TypeBuilder(destination) {
    _classCallCheck(this, TypeBuilder);

    this._destination = destination;
    this._definitions = {};
  }

  _createClass(TypeBuilder, {
    "enum": {
      value: function _enum(name, members) {
        var result = new Definition(XDR.Enum.create, name, members);
        this.define(name, result);
      }
    },
    struct: {
      value: function struct(name, members) {
        var result = new Definition(XDR.Struct.create, name, members);
        this.define(name, result);
      }
    },
    union: {
      value: function union(name, config) {
        var result = new Definition(XDR.Union.create, name, config);
        this.define(name, result);
      }
    },
    typedef: {
      value: function typedef(name, config) {
        // let the reference resoltion system do it's thing
        // the "constructor" for a typedef just returns the resolved value
        var createTypedef = function (name, args) {
          return args;
        };

        var result = new Definition(createTypedef, name, config);
        this.define(name, result);
      }
    },
    "const": {
      value: function _const(name, config) {
        var createConst = function (name, args) {
          return args;
        };
        var result = new Definition(createConst, name, config);
        this.define(name, result);
      }
    },
    "void": {
      value: function _void() {
        return XDR.Void;
      }
    },
    bool: {
      value: function bool() {
        return XDR.Bool;
      }
    },
    int: {
      value: function int() {
        return XDR.Int;
      }
    },
    hyper: {
      value: function hyper() {
        return XDR.Hyper;
      }
    },
    uint: {
      value: function uint() {
        return XDR.UnsignedInt;
      }
    },
    uhyper: {
      value: function uhyper() {
        return XDR.UnsignedHyper;
      }
    },
    float: {
      value: function float() {
        return XDR.Float;
      }
    },
    double: {
      value: function double() {
        return XDR.Double;
      }
    },
    quadruple: {
      value: function quadruple() {
        return XDR.Quadruple;
      }
    },
    string: {
      value: function string(length) {
        return new XDR.String(length);
      }
    },
    opaque: {
      value: function opaque(length) {
        return new XDR.Opaque(length);
      }
    },
    varOpaque: {
      value: function varOpaque(length) {
        return new XDR.VarOpaque(length);
      }
    },
    array: {
      value: function array(childType, length) {
        if (childType instanceof Reference) {
          return new ArrayReference(childType, length);
        } else {
          return new XDR.Array(childType, length);
        }
      }
    },
    varArray: {
      value: function varArray(childType, maxLength) {
        if (childType instanceof Reference) {
          return new ArrayReference(childType, maxLength, true);
        } else {
          return new XDR.VarArray(childType, maxLength);
        }
      }
    },
    option: {
      value: function option(childType) {
        if (childType instanceof Reference) {
          return new OptionReference(childType);
        } else {
          return new XDR.Option(childType);
        }
      }
    },
    define: {
      value: function define(name, definition) {
        if (isUndefined(this._destination[name])) {
          this._definitions[name] = definition;
        } else {
          throw new Error("XDR Error:" + name + " is already defined");
        }
      }
    },
    lookup: {
      value: function lookup(name) {
        return new SimpleReference(name);
      }
    },
    resolve: {
      value: function resolve() {
        var _this = this;

        var sequence = [];
        sequencify(this._definitions, map(this._definitions, function (d) {
          return d.name;
        }), sequence);

        each(sequence, function (name) {
          var defn = _this._definitions[name];
          var deps = pick.apply(undefined, [_this._destination].concat(_toConsumableArray(defn.dep)));
          var result = defn.create(deps);

          //Ensure we aren't redefining a name
          if (!isUndefined(_this._destination[name])) {
            throw new Error("XDR Error:" + name + " is already defined");
          }

          _this._destination[name] = result;
        });
      }
    }
  });

  return TypeBuilder;
})();