import { Cursor } from "./cursor";
import extend from "lodash/extend";
import isFunction from "lodash/isFunction";

//TODO: build a system to grow a buffer as we write to it
const BUFFER_SIZE = Math.pow(2,16); 

var staticMethods = {
  toXDR(val) {
    let cursor = new Cursor(BUFFER_SIZE);
    this.write(val, cursor);
    let bytesWritten = cursor.tell();
    cursor.rewind();
    
    return cursor.slice(bytesWritten).buffer();
  },

  fromXDR(input, format="raw") {
    let buffer;
    switch(format) {
      case "raw":    buffer = input; break;
      case "hex":    buffer = new Buffer(input, "hex"); break;
      case "base64": buffer = new Buffer(input, "base64"); break;
      default:
        throw new Error(`Invalid format ${format}, must be "raw", "hex", "base64"`);
    }

    let cursor = new Cursor(buffer);
    let result = this.read(cursor);

    //TODO: error out if the entire buffer isn't consumed
    
    return result;
  },
};

var instanceMethods = {
  toXDR(format="raw") {
    let buffer = this.constructor.toXDR(this);
    switch(format) {
      case "raw": return buffer;
      case "hex":    return buffer.toString('hex');
      case "base64": return buffer.toString('base64');
      default: 
      throw new Error(`Invalid format ${format}, must be "raw", "hex", "base64"`);
    }
  }
};

export default function includeIoMixin(obj) {
  extend(obj, staticMethods);

  if (isFunction(obj)) {
    extend(obj.prototype, instanceMethods);
  }
}
