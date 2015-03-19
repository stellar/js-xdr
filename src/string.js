import { Int } from "./int";
import {calculatePadding} from "./util";
import {isString} from "lodash";

export class String {
  constructor(maxLength) {
    this._maxLength = maxLength;
  }

  read(io) {
    let length = Int.read(io);

    if (length > this._maxLength) {
      throw new Error(
        `XDR Read Error: Saw ${length} length String,` + 
        `max allowed is ${this._maxLength}`
      );
    }
    let padding = calculatePadding(length);
    let result = io.slice(length);
    io.slice(padding); //consume padding
    return result.buffer().toString('ascii');
  }

  write(value, io) {
    if(value.length > this._maxLength) {
      throw new Error(
        `XDR Write Error: Got ${value.length} bytes,` + 
        `max allows is ${this._maxLength}`);
    }

    if(!isString(value)) {
      throw new Error(`XDR Write Error: ${value} is not a string,`);
    }
    let buffer = new Buffer(value, 'ascii');
    
    Int.write(value.length, io);
    io.writeBufferPadded(buffer);
  }

  isValid(value) {
    return isString(value) && value.length <= this._maxLength;
  }
}