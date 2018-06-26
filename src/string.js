import { Int } from "./int";
import { UnsignedInt } from "./unsigned-int";
import {calculatePadding, slicePadding} from "./util";
import isString from "lodash/isString";
import includeIoMixin from './io-mixin';

export class String {
  constructor(maxLength=UnsignedInt.MAX_VALUE) {
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
    slicePadding(io, padding);
    return result.buffer().toString('utf8');
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
    let buffer = Buffer.from(value, 'utf8');
    
    Int.write(buffer.length, io);
    io.writeBufferPadded(buffer);
  }

  isValid(value) {
    if (!isString(value)) {
      return false;
    }
    let buffer = Buffer.from(value, 'utf8');
    return buffer.length <= this._maxLength;
  }
}

includeIoMixin(String.prototype);
