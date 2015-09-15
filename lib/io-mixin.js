"use strict";

module.exports = includeIoMixin;

var Cursor = require("./cursor").Cursor;

var _lodash = require("lodash");

var extend = _lodash.extend;
var isFunction = _lodash.isFunction;

//TODO: build a system to grow a buffer as we write to it
var BUFFER_SIZE = Math.pow(2, 16);

var staticMethods = {
  toXDR: function toXDR(val) {
    var cursor = new Cursor(BUFFER_SIZE);
    this.write(val, cursor);
    var bytesWritten = cursor.tell();
    cursor.rewind();

    return cursor.slice(bytesWritten).buffer();
  },

  fromXDR: function fromXDR(input) {
    var format = arguments[1] === undefined ? "raw" : arguments[1];

    var buffer = undefined;
    switch (format) {
      case "raw":
        buffer = input;break;
      case "hex":
        buffer = new Buffer(input, "hex");break;
      case "base64":
        buffer = new Buffer(input, "base64");break;
      default:
        throw new Error("Invalid format " + format + ", must be \"raw\", \"hex\", \"base64\"");
    }

    var cursor = new Cursor(buffer);
    var result = this.read(cursor);

    //TODO: error out if the entire buffer isn't consumed

    return result;
  } };

var instanceMethods = {
  toXDR: function toXDR() {
    var format = arguments[0] === undefined ? "raw" : arguments[0];

    var buffer = this.constructor.toXDR(this);
    switch (format) {
      case "raw":
        return buffer;
      case "hex":
        return buffer.toString("hex");
      case "base64":
        return buffer.toString("base64");
      default:
        throw new Error("Invalid format " + format + ", must be \"raw\", \"hex\", \"base64\"");
    }
  }
};

function includeIoMixin(obj) {
  extend(obj, staticMethods);

  if (isFunction(obj)) {
    extend(obj.prototype, instanceMethods);
  }
}