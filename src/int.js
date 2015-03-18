import {isNumber} from 'lodash';

const MAX_INT = Math.pow(2, 31) - 1;
const MIN_INT = -Math.pow(2, 31);

export var Int = {

  read(buffer, offset) {
    return buffer.readInt32BE(offset);
  },

  write(value, buffer, offset) {
    buffer.writeInt32BE(value, offset);
    return 4;
  },

  isValid(value) {
    if (!isNumber(value)){ return false; }

    let asInt = Math.floor(value);

    return asInt >= MIN_INT && asInt <= MAX_INT; 
  },
};