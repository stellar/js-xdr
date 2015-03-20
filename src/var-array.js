import { Int } from "./int";
import { UnsignedInt } from "./unsigned-int";
import { all, each, times, isArray } from 'lodash';
import includeIoMixin from './io-mixin';

export class VarArray {
  constructor(childType, maxLength=UnsignedInt.MAX_VALUE) {
    this._childType = childType;
    this._maxLength = maxLength;
  }

  read(io) {
    let length = Int.read(io);

    if (length > this._maxLength) {
      throw new Error(
        `XDR Read Error: Saw ${length} length VarArray,` + 
        `max allowed is ${this._maxLength}`
      );
    }

    return times(length, () => this._childType.read(io));
  }

  write(value, io) {

    if(!isArray(value)) {
      throw new Error(`XDR Write Error: value is not array`);
    }

    if(value.length > this._maxLength) {
      throw new Error(
        `XDR Write Error: Got array of size ${value.length},` + 
        `max allowed is ${this._maxLength}`);
    }

    Int.write(value.length, io);
    each(value, child => this._childType.write(child, io));
  }

  isValid(value) {
    if(!isArray(value)){ return false; }
    if(value.length > this._maxLength){ return false; }

    return all(value, child => this._childType.isValid(child));
  }
}

includeIoMixin(VarArray.prototype);