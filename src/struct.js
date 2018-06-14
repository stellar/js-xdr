import each from "lodash/each";
import map from "lodash/map";
import isUndefined from "lodash/isUndefined";
import fromPairs from "lodash/fromPairs";
import { Reference } from "./config";
import includeIoMixin from './io-mixin';

export class Struct {

  constructor(attributes) {
    this._attributes = attributes || {};
  }

  static read(io) {
    let fields = map(this._fields, field => {
      let [name, type] = field;
      let value = type.read(io);
      return [name, value];
    });

    return new this(fromPairs(fields));
  }

  static write(value, io) {
    if(!(value instanceof this)) {
      throw new Error(`XDR Write Error: ${value} is not a ${this.structName}`);
    }
    each(this._fields, field => {
      let [name, type] = field;
      let attribute = value._attributes[name];
      type.write(attribute,io);
    });
  }

  static isValid(value) {
    return value instanceof this;
  }

  static create(context, name, fields) {
    let ChildStruct = class extends Struct {
      constructor(...args) {
        super(...args);
      }
    };

    ChildStruct.structName = name;

    context.results[name] = ChildStruct;

    ChildStruct._fields = fields.map(([name, field]) => {
      if (field instanceof Reference) {
        field = field.resolve(context);
      }

      return [name, field];
    });

    each(ChildStruct._fields, field => {
      let [fieldName] = field;
      ChildStruct.prototype[fieldName] = readOrWriteAttribute(fieldName);
    });

    return ChildStruct;
  }
}

includeIoMixin(Struct);

function readOrWriteAttribute(name) {
  return function(value) {
    if(!isUndefined(value)) {
      this._attributes[name] = value;
    }

    return this._attributes[name];
  };
}
