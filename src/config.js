import * as XDR from "./types";
import isUndefined from "lodash/isUndefined";
import isPlainObject from "lodash/isPlainObject";
import isArray from "lodash/isArray";
import each from "lodash/each";
import map from "lodash/map";
import pick from "lodash/pick";


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
  }

  resolve(context) {
    let resolvedChild = this.childReference;
    let length = this.length;

    if (resolvedChild instanceof Reference) {
      resolvedChild = resolvedChild.resolve(context);
    }

    if (length instanceof Reference) {
      length = length.resolve(context);
    }

    if (this.variable) {
      return new XDR.VarArray(resolvedChild, length);
    } else {
      return new XDR.Array(resolvedChild, length);
    }
  }
}

class OptionReference extends Reference {
  constructor(childReference) {
    this.childReference = childReference;
    this.name           = childReference.name;
  }

  resolve(context) {
    let resolvedChild = this.childReference;

    if (resolvedChild instanceof Reference) {
      resolvedChild = resolvedChild.resolve(context);
    }

    return new XDR.Option(resolvedChild);
  }
}

class SizedReference extends Reference {
  constructor(sizedType, length) {
    this.sizedType = sizedType;
    this.length    = length;
  }

  resolve(context) {
    let length = this.length;

    if (length instanceof Reference) {
      length = length.resolve(context);
    }

    return new this.sizedType(length);
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

  string(length) { return new SizedReference(XDR.String, length); }
  opaque(length) { return new SizedReference(XDR.Opaque, length); }
  varOpaque(length) { return new SizedReference(XDR.VarOpaque, length); }

  array(childType, length) {
    return new ArrayReference(childType, length);
  }

  varArray(childType, maxLength) {
    return new ArrayReference(childType, maxLength, true);
  }

  option(childType) {
    return new OptionReference(childType);
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
