import { Int }  from "./int";
import { each } from "lodash";

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

  static create(name, members) {
    let ChildEnum = class extends Enum {
      constructor(...args) {
        super(...args);
      }
    };

    ChildEnum.enumName = name;
    ChildEnum._members = new Map();
    ChildEnum._byValue = new Map();
    
    each(members, (value, key) => {
      let inst = new ChildEnum(key, value);
      ChildEnum._members.set(key, inst);
      ChildEnum._byValue.set(value, inst);
      ChildEnum[key] = function() {
        return inst;
      };
    });

    return ChildEnum;
  }
}