import {isNumber} from 'lodash';

export var Double = {

  read(io) {
    return io.readDoubleBE();
  },

  write(value, io) {
    io.writeDoubleBE(value);
  },

  isValid(value) {
    return isNumber(value);
  },
};