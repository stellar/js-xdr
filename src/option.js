import { Bool } from "./bool";
import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import includeIoMixin from './io-mixin';

export class Option {
  constructor(childType) {
    this._childType = childType;
  }

  read(io) {
    if(Bool.read(io)) {
      return this._childType.read(io);
    }
  }

  write(value, io) {
    let isPresent = !(isNull(value) || isUndefined(value));

    Bool.write(isPresent, io);

    if(isPresent) {
      this._childType.write(value, io);
    }
  }

  isValid(value) {
    if(isNull(value)){ return true; }
    if(isUndefined(value)){ return true; }

    return this._childType.isValid(value);
  }
}

includeIoMixin(Option.prototype);
