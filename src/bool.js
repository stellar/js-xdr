import { Int } from "./int";
import isBoolean from "lodash/isBoolean";
import includeIoMixin from './io-mixin';

export var Bool = {
  read(io) {
    let value = Int.read(io);

    switch(value) {
      case 0: return false;
      case 1: return true;
      default: throw new Error(`XDR Read Error: Got ${value} when trying to read a bool`);
    }
  },

  write(value, io) {
    let intVal = value ? 1 : 0;
    return Int.write(intVal, io);
  },

  isValid(value) {
    return isBoolean(value);
  }
};

includeIoMixin(Bool);
