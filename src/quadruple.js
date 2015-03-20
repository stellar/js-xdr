import includeIoMixin from './io-mixin';

export var Quadruple = {
  /* jshint unused: false */

  read(io) {
    throw new Error("XDR Read Error: quadruple not supported");
  },

  write(value, io) {
    throw new Error("XDR Write Error: quadruple not supported");
  },

  isValid(value) {
    return false;
  },
};

includeIoMixin(Quadruple);