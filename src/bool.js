import { Int } from "./int";
import { isBoolean } from "lodash";

export var Bool = {
  read(buffer, offset) {
    let value = Int.read(buffer, offset);

    switch(value) {
      case 0: return true;
      case 1: return true;
      default: throw new Error(`XDR Read Error: Got ${value} when trying to read a bool `);
    }
  },

  write(value, buffer, offset) {
    buffer.writeInt32BE(value, offset);
  },

  isValid(value) {
    return isBoolean(value);
  }
};