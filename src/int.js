import {isNumber} from 'lodash';

const MAX_INT = Math.pow(2, 31) - 1;
const MIN_INT = -Math.pow(2, 31);

export var Int = {

  read(io) {
    return io.readInt32BE();
  },

  write(value, io) {
    if(!isNumber(value)){ 
      throw new Error("XDR Write Error: not a number");
    }

    io.writeInt32BE(value);
  },

  isValid(value) {
    if (!isNumber(value)){ return false; }

    let asInt = Math.floor(value);

    return asInt >= MIN_INT && asInt <= MAX_INT; 
  },
};