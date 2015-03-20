import { each, map, isUndefined } from "lodash";
import { cloneDeep, partial, zipObject } from "lodash";

export class Struct {

  constructor(attributes) {
    this._attributes = cloneDeep(attributes);
  }

  static read(io) {
    let fields = map(this._fields, field => {
      let [name, type] = field;
      let value = type.read(io);
      return [name, value];
    });

    return new this(zipObject(fields));
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

  static create(name, fields) {
    let ChildStruct = class extends Struct {
      constructor(...args) {
        super(...args);
      }
    };

    ChildStruct.structName = name;
    ChildStruct._fields = cloneDeep(fields);
    
    each(fields, field => {
      let [fieldName] = field;

      ChildStruct.prototype[fieldName] = partial(readOrWriteAttribute, fieldName);
    });

    return ChildStruct;
  }
}

function readOrWriteAttribute(name, value) {
  if(!isUndefined(value)) {
    this._attributes[name] = value;
  }

  return this._attributes[name];
}