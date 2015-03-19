import { isUndefined } from 'lodash';

export var Void = {
  /* jshint unused: false */

  read(io) {
    return undefined;
  },

  write(value, io) {
    if(!isUndefined(value)){ 
      throw new Error("XDR Write Error: trying to write value to a void slot");
    }
  },

  isValid(value) {
    return isUndefined(value);
  },
};