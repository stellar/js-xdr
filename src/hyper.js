import Long  from 'long';

export class Hyper extends Long {
  static read(io) {
    let high = io.readInt32BE();
    let low  = io.readInt32BE();
    return this.fromBits(low, high, false);
  }

  static write(value, io) {
    if(!(value instanceof this)) {
      throw new Error(
        `XDR Write Error: ${value} is not a Hyper`
      );
    }

    io.writeInt32BE(value.high);
    io.writeInt32BE(value.low);
  }

  static fromString(string) {
    let result = super.fromString(string, false);
    return new this(result.low, result.high);
  }

  static isValid(value) {
    return value instanceof this;
  }

  constructor(low, high) {
    super(low, high, false);
  }
}

Hyper.MAX_VALUE = new Hyper(Long.MAX_VALUE.low, Long.MAX_VALUE.high);
Hyper.MIN_VALUE = new Hyper(Long.MIN_VALUE.low, Long.MIN_VALUE.high);