import { XdrPrimitiveType } from './xdr-type';
import { XdrWriterError } from './errors';

const MIN_VALUE = 0n;
const MAX_VALUE = 0xFFFFFFFFFFFFFFFFn;

export class UnsignedHyper extends XdrPrimitiveType {
  constructor(low, high) {
    super();
    if (typeof low === 'bigint') {
      if (low < MIN_VALUE || low > MAX_VALUE)
        throw new TypeError('Invalid u64 value');
      this._value = low;
    } else {
      if ((low | 0) !== low || (high | 0) !== high)
        throw new TypeError('Invalid u64 value');
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
    return true;
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
    return new UnsignedHyper(reader.readBigUInt64BE());
  }

  /**
   * @inheritDoc
   */
  static write(value, writer) {
    if (!(value instanceof this))
      throw new XdrWriterError(`${value} is not an UnsignedHyper`);
    writer.writeBigUInt64BE(value._value);
  }

  /**
   * Create UnsignedHyper instance from string
   * @param {String} string - Numeric representation
   * @return {UnsignedHyper}
   */
  static fromString(string) {
    if (!/^\d{0,20}$/.test(string))
      throw new TypeError(`Invalid u64 string value: ${string}`);
    return new UnsignedHyper(BigInt(string));
  }

  /**
   * Create UnsignedHyper from two [high][low] i32 values
   * @param {Number} low - Low part of u64 number
   * @param {Number} high - High part of u64 number
   * @return {UnsignedHyper}
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

UnsignedHyper.MAX_VALUE = new UnsignedHyper(MAX_VALUE);
UnsignedHyper.MIN_VALUE = new UnsignedHyper(MIN_VALUE);
