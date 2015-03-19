import {isNumber} from 'lodash';

const MAX_INT = Math.pow(2, 31) - 1;
const MIN_INT = -Math.pow(2, 31);

export var Int = {

  read(io) {
    return io.readInt32BE();
  },

  write(value, io) {
    io.writeInt32BE(value);
  },

  isValid(value) {
    if (!isNumber(value)){ return false; }

    let asInt = Math.floor(value);

    return asInt >= MIN_INT && asInt <= MAX_INT; 
  },
};