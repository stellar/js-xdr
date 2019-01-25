import isUndefined from 'lodash/isUndefined';
import each from 'lodash/each';
import * as XDR from './types';

export function config(fn, types = {}) {
  if (fn) {
    const builder = new TypeBuilder(types);
    fn(builder);
    builder.resolve();
  }

  return types;
}

export class Reference {
  /* jshint unused: false */
  resolve() {
    throw new Error('implement resolve in child class');
  }
}

class SimpleReference extends Reference {
  constructor(name) {
    super();
    this.name = name;
  }

  resolve(context) {
    const defn = context.definitions[this.name];
    return defn.resolve(context);
  }
}

class ArrayReference extends Reference {
  constructor(childReference, length, variable = false) {
    super();
    this.childReference = childReference;
    this.length = length;
    this.variable = variable;
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
    }
    return new XDR.Array(resolvedChild, length);
  }
}

class OptionReference extends Reference {
  constructor(childReference) {
    super();
    this.childReference = childReference;
    this.name = childReference.name;
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
    super();
    this.sizedType = sizedType;
    this.length = length;
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
  constructor(constructor, name, cfg) {
    this.constructor = constructor;
    this.name = name;
    this.config = cfg;
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

// let the reference resoltion system do it's thing
// the "constructor" for a typedef just returns the resolved value
function createTypedef(context, typeName, value) {
  if (value instanceof Reference) {
    value = value.resolve(context);
  }
  context.results[typeName] = value;
  return value;
}

function createConst(context, name, value) {
  context.results[name] = value;
  return value;
}

class TypeBuilder {
  constructor(destination) {
    this._destination = destination;
    this._definitions = {};
  }

  enum(name, members) {
    const result = new Definition(XDR.Enum.create, name, members);
    this.define(name, result);
  }

  struct(name, members) {
    const result = new Definition(XDR.Struct.create, name, members);
    this.define(name, result);
  }

  union(name, cfg) {
    const result = new Definition(XDR.Union.create, name, cfg);
    this.define(name, result);
  }

  typedef(name, cfg) {
    const result = new Definition(createTypedef, name, cfg);
    this.define(name, result);
  }

  const(name, cfg) {
    const result = new Definition(createConst, name, cfg);
    this.define(name, result);
  }

  void() {
    return XDR.Void;
  }
  bool() {
    return XDR.Bool;
  }
  int() {
    return XDR.Int;
  }
  hyper() {
    return XDR.Hyper;
  }
  uint() {
    return XDR.UnsignedInt;
  }
  uhyper() {
    return XDR.UnsignedHyper;
  }
  float() {
    return XDR.Float;
  }
  double() {
    return XDR.Double;
  }
  quadruple() {
    return XDR.Quadruple;
  }

  string(length) {
    return new SizedReference(XDR.String, length);
  }
  opaque(length) {
    return new SizedReference(XDR.Opaque, length);
  }
  varOpaque(length) {
    return new SizedReference(XDR.VarOpaque, length);
  }

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
    if (isUndefined(this._destination[name])) {
      this._definitions[name] = definition;
    } else {
      throw new Error(`XDR Error:${name} is already defined`);
    }
  }

  lookup(name) {
    return new SimpleReference(name);
  }

  resolve() {
    each(this._definitions, (defn) => {
      defn.resolve({
        definitions: this._definitions,
        results: this._destination
      });
    });
  }
}
