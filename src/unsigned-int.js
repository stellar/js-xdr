import {isNumber} from 'lodash';

const MAX_UINT = Math.pow(2, 32) - 1;
const MIN_UINT = 0;

export var UnsignedInt = {

  read(io) {
    return io.readUInt32BE();
  },

  write(value, io) {
    if(!isNumber(value)){ 
      throw new Error("XDR Write Error: not a number");
    }

    if(Math.floor(value) !== value){ 
      throw new Error("XDR Write Error: not an integer");
    }

    if(value < 0){ 
      throw new Error(`XDR Write Error: negative number ${value}`);
    }

    io.writeUInt32BE(value);
  },

  isValid(value) {
    if (!isNumber(value)){ return false; }
    if (Math.floor(value) !== value ){ return false; }

    return value >= MIN_UINT && value <= MAX_UINT; 
  },
};