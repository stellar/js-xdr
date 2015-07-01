"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

exports.config = config;
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

function config(fn) {
  if (fn) {
    var builder = new TypeBuilder(types);
    fn(builder);
    builder.resolve();
  }

  return types;
}

var Reference = exports.Reference = (function () {
  function Reference() {
    _classCallCheck(this, Reference);
  }

  _createClass(Reference, {
    resolve: {
      /* jshint unused: false */

      value: function resolve(context) {
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
      value: function resolve(context) {
        var defn = context.definitions[this.name];
        return defn.resolve(context);
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
      value: function resolve(context) {
        var resolvedChild = this.childReference.resolve(context);
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
      value: function resolve(context) {
        var resolvedChild = this.childReference.resolve(context);
        return new XDR.Option(resolvedChild);
      }
    }
  });

  return OptionReference;
})(Reference);

var Definition = (function () {
  function Definition(constructor, name, config) {
    _classCallCheck(this, Definition);

    this.constructor = constructor;
    this.name = name;
    this.config = config;
  }

  _createClass(Definition, {
    resolve: {

      // resolve calls the constructor of this definition with the provided context
      // and this definitions config values.  The definitions constructor should
      // populate the final type on `context.results`, and may refer to other
      // definitions through `context.definitions`

      value: function resolve(context) {
        if (this.name in context.results) {
          return context.results[this.name];
        }

        return this.constructor(context, this.name, this.config);
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
        var createTypedef = function (context, name, value) {
          if (value instanceof Reference) {
            value = value.resolve(context);
          }
          context.results[name] = value;
          return value;
        };

        var result = new Definition(createTypedef, name, config);
        this.define(name, result);
      }
    },
    "const": {
      value: function _const(name, config) {
        var createConst = function (context, name, value) {
          context.results[name] = value;
          return value;
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

        each(this._definitions, function (defn, name) {
          defn.resolve({
            definitions: _this._definitions,
            results: _this._destination
          });
        });
      }
    }
  });

  return TypeBuilder;
})();