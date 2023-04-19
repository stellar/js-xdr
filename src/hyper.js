import { XdrPrimitiveType } from './xdr-type';
import { XdrWriterError } from './errors';

const MIN_VALUE = -9223372036854775808n;
const MAX_VALUE = 9223372036854775807n;

export class Hyper extends XdrPrimitiveType {
  constructor(low, high) {
    super();
    if (typeof low === 'bigint') {
      if (low < MIN_VALUE || low > MAX_VALUE)
        throw new TypeError('Invalid i64 value');
      this._value = low;
    } else {
      if ((low | 0) !== low || (high | 0) !== high)
        throw new TypeError('Invalid i64 value');
      this._value = (BigInt(high >>> 0) << 32n) | BigInt(low >>> 0);
    }
  }

  get low() {
    return Number(this._value & 0xFFFFFFFFn) << 0;
  }

  get high() {
    return Number(this._value >> 32n) >> 0;
  }

  get unsigned() {
    return false;
  }

  toString() {
    return this._value.toString();
  }

  toJSON() {
    return {_value: this._value.toString()}
  }

  /**
   * @inheritDoc
   */
  static read(reader) {
    return new Hyper(reader.readBigInt64BE());
  }

  /**
   * @inheritDoc
   */
  static write(value, writer) {
    if (!(value instanceof this))
      throw new XdrWriterError(`${value} is not a Hyper`);
    writer.writeBigInt64BE(value._value);
  }

  /**
   * Create Hyper instance from string
   * @param {String} string - Numeric representation
   * @return {Hyper}
   */
  static fromString(string) {
    if (!/^-?\d{0,19}$/.test(string))
      throw new TypeError(`Invalid i64 string value: ${string}`);
    return new Hyper(BigInt(string));
  }

  /**
   * Create Hyper from two [high][low] i32 values
   * @param {Number} low - Low part of i64 number
   * @param {Number} high - High part of i64 number
   * @return {Hyper}
   */
  static fromBits(low, high) {
    return new this(low, high);
  }

  /**
   * @inheritDoc
   */
  static isValid(value) {
    return value instanceof this;
  }
}

Hyper.MAX_VALUE = new Hyper(MAX_VALUE);
Hyper.MIN_VALUE = new Hyper(MIN_VALUE);
