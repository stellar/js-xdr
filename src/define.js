import * as XDR from "./types";
import {isUndefined, isPlainObject, isArray} from "lodash";
import {each, map, pick} from "lodash";
import sequencify from "sequencify";


// types is the root 
var types = {};


export function define(fn) {
  if (fn) {
    let builder = new TypeBuilder(types);
    fn(builder);
    builder.resolve();
  }

  return types;
}


class Reference {
  /* jshint unused: false */
  resolve(definitions) {
    throw new Error("implement resolve in child class");
  }
}

class SimpleReference extends Reference {
  constructor(name) {
    this.name = name;
  }

  resolve(definitions) {
    return definitions[this.name];
  }
}

class ArrayReference extends Reference {
  constructor(childReference, length, variable=false) {
    this.childReference = childReference;
    this.length         = length;
    this.variable       = variable;
    this.name           = childReference.name;
  }

  resolve(definitions) {
    let resolvedChild = this.childReference.resolve(definitions);
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

  resolve(definitions) {
    let resolvedChild = this.childReference.resolve(definitions);
    return new XDR.Option(resolvedChild);
  }
}

class Definition {
  constructor(constructor, name, ...config) {
    this.constructor = constructor;
    this.name        = name;
    this.config      = config;
    this.dep         = [];

    // walk the defintion config for Reference objects, push their names onto
    // this.deps so we can use sequencify to order our resolutions
    this._walkConfig(this.config, value => {
      if(value instanceof Reference) {
        this.dep.push(value.name);
      }
    });
  }

  create(deps) {
    this._walkConfig(this.config, (value, key, parent) => {
      if(!(value instanceof Reference)) { return; }

      let dep = value.resolve(deps);

      if(!dep) {
        // throw if the reference couldn't be resolved
        throw new Error(`XDR Error:${value.name} could not be resolved.`);
      } else {
        // overwrite the reference with the concrete value
        parent[key] = dep;
      }
    });

    // actually create the concrete definition
    return this.constructor(this.name, ...this.config);
  }

  _walkConfig(current, fn) {

    each(current, (value, key) => {
      fn(value, key, current);

      // recurse if the value is a nested object
      if (isPlainObject(value) || isArray(value)) {
        this._walkConfig(value, fn);
      }
    });
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
    let createTypedef = (name, args) => args;

    let result = new Definition(createTypedef, name, config);
    this.define(name, result);
  }

  const(name, config) {
    let createConst = (name, args) => args;
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
    let sequence = [];
    sequencify(this._definitions, map(this._definitions, d => d.name), sequence);

    each(sequence, name => {
      let defn = this._definitions[name]; 
      let deps = pick(this._destination, ...defn.dep);
      let result = defn.create(deps);

      //Ensure we aren't redefining a name
      if(!isUndefined(this._destination[name])) {
        throw new Error(`XDR Error:${name} is already defined`);
      }
      
      this._destination[name] = result;
    });
  }
}