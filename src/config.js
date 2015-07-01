import * as XDR from "./types";
import {isUndefined, isPlainObject, isArray} from "lodash";
import {each, map, pick} from "lodash";
import sequencify from "sequencify";


// types is the root
var types = {};


export function config(fn) {
  if (fn) {
    let builder = new TypeBuilder(types);
    fn(builder);
    builder.resolve();
  }

  return types;
}


export class Reference {
  /* jshint unused: false */
  resolve(context) {
    throw new Error("implement resolve in child class");
  }
}

class SimpleReference extends Reference {
  constructor(name) {
    this.name = name;
  }

  resolve(context) {
    let defn = context.definitions[this.name];
    return defn.resolve(context);
  }
}

class ArrayReference extends Reference {
  constructor(childReference, length, variable=false) {
    this.childReference = childReference;
    this.length         = length;
    this.variable       = variable;
    this.name           = childReference.name;
  }

  resolve(context) {
    let resolvedChild = this.childReference.resolve(context);
    if (this.variable) {
      return new XDR.VarArray(resolvedChild, this.length);
    } else {
      return new XDR.Array(resolvedChild, this.length);
    }
  }
}

class OptionReference extends Reference {
  constructor(childReference) {
    this.childReference = childReference;
    this.name           = childReference.name;
  }

  resolve(context) {
    let resolvedChild = this.childReference.resolve(context);
    return new XDR.Option(resolvedChild);
  }
}

class Definition {
  constructor(constructor, name, config) {
    this.constructor = constructor;
    this.name        = name;
    this.config      = config;
  }

  // resolve calls the constructor of this definition with the provided context
  // and this definitions config values.  The definitions constructor should
  // populate the final type on `context.results`, and may refer to other
  // definitions through `context.definitions`
  resolve(context) {
    if (this.name in context.results) {
      return context.results[this.name];
    }

    return this.constructor(context, this.name, this.config);
  }
}

class TypeBuilder {
  constructor(destination) {
    this._destination = destination;
    this._definitions = {};
  }

  enum(name, members) {
    let result = new Definition(XDR.Enum.create, name, members);
    this.define(name, result);
  }

  struct(name, members) {
    let result = new Definition(XDR.Struct.create, name, members);
    this.define(name, result);
  }

  union(name, config) {
    let result = new Definition(XDR.Union.create, name, config);
    this.define(name, result);
  }

  typedef(name, config) {
    // let the reference resoltion system do it's thing
    // the "constructor" for a typedef just returns the resolved value
    let createTypedef = (context, name, value) => {
      if (value instanceof Reference) {
        value = value.resolve(context);
      }
      context.results[name] = value;
      return value;
    };

    let result = new Definition(createTypedef, name, config);
    this.define(name, result);
  }

  const(name, config) {
    let createConst = (context, name, value) => {
      context.results[name] = value;
      return value;
    };

    let result = new Definition(createConst, name, config);
    this.define(name, result);
  }

  void() { return XDR.Void; }
  bool() { return XDR.Bool; }
  int() { return XDR.Int; }
  hyper() { return XDR.Hyper; }
  uint() { return XDR.UnsignedInt; }
  uhyper() { return XDR.UnsignedHyper; }
  float() { return XDR.Float; }
  double() { return XDR.Double; }
  quadruple() { return XDR.Quadruple; }

  string(length) { return new XDR.String(length); }
  opaque(length) { return new XDR.Opaque(length); }
  varOpaque(length) { return new XDR.VarOpaque(length); }

  array(childType, length) {
    if (childType instanceof Reference) {
      return new ArrayReference(childType, length);
    } else {
      return new XDR.Array(childType, length);
    }
  }

  varArray(childType, maxLength) {
    if (childType instanceof Reference) {
      return new ArrayReference(childType, maxLength, true);
    } else {
      return new XDR.VarArray(childType, maxLength);
    }
  }

  option(childType) {
    if (childType instanceof Reference) {
      return new OptionReference(childType);
    } else {
      return new XDR.Option(childType);
    }
  }


  define(name, definition) {
    if(isUndefined(this._destination[name])) {
      this._definitions[name] = definition;
    } else {
      throw new Error(`XDR Error:${name} is already defined`);
    }
  }

  lookup(name) {
    return new SimpleReference(name);
  }

  resolve() {
    each(this._definitions, (defn, name) => {
      defn.resolve({
        definitions: this._definitions,
        results:    this._destination
      });
    });
  }
}
