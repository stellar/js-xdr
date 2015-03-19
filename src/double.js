import {isNumber} from 'lodash';

export var Double = {

  read(io) {
    return io.readDoubleBE();
  },

  write(value, io) {
    if(!isNumber(value)){ 
      throw new Error("XDR Write Error: not a number");
    }

    io.writeDoubleBE(value);
  },

  isValid(value) {
    return isNumber(value);
  },
};