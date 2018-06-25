import { Int }  from "./int";
import each from "lodash/each";
import vals from "lodash/values";
import includeIoMixin from './io-mixin';

export class Enum {

  constructor(name, value) {
    this.name  = name;
    this.value = value;
  }

  static read(io) {
    let intVal = Int.read(io);

    if(!this._byValue.has(intVal)) {
      throw new Error(
        `XDR Read Error: Unknown ${this.enumName} member for value ${intVal}`
      );
    }

    return this._byValue.get(intVal);
  }

  static write(value, io) {
    if(!(value instanceof this)) {
      throw new Error(
        `XDR Write Error: Unknown ${value} is not a ${this.enumName}`
      );
    }

    Int.write(value.value, io);
  }

  static isValid(value) {
    return value instanceof this;
  }

  static members() {
    return this._members;
  }

  static values() {
    return vals(this._members);
  }

  static fromName(name) {
    let result = this._members[name];

    if(!result) {
      throw new Error(`${name} is not a member of ${this.enumName}`);
    }

    return result;
  }

  static create(context, name, members) {
    let ChildEnum = class extends Enum {
      constructor(...args) {
        super(...args);
      }
    };

    ChildEnum.enumName = name;
    context.results[name] = ChildEnum;

    ChildEnum._members = {};
    ChildEnum._byValue = new Map();

    each(members, (value, key) => {
      let inst = new ChildEnum(key, value);
      ChildEnum._members[key] = inst;
      ChildEnum._byValue.set(value, inst);
      ChildEnum[key] = function() {
        return inst;
      };
    });

    return ChildEnum;
  }
}

includeIoMixin(Enum);
