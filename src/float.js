import {isNumber} from 'lodash';

export var Float = {

  read(io) {
    return io.readFloatBE();
  },

  write(value, io) {
    io.writeFloatBE(value);
  },

  isValid(value) {
    return isNumber(value);
  },
};