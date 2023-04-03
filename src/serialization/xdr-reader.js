/**
 * @internal
 */
import { XdrReaderError } from '../errors';

export class XdrReader {
  /**
   * @constructor
   * @param {Buffer} source - Buffer containing serialized data
   */
  constructor(source) {
    if (!(source instanceof Buffer)) {
      if (source instanceof Array) {
        source = Buffer.from(source)
      } else {
        throw new XdrReaderError('source not specified');
      }
    }

    this._buffer = source;
    this._length = source.length;
    this._index = 0;
  }

  /**
   * @type {Buffer}
   * @private
   * @readonly
   */
  _buffer
  /**
   * @type {Number}
   * @private
   * @readonly
   */
  _length
  /**
   * @type {Number}
   * @private
   * @readonly
   */
  _index

  /**
   * Check if the reader reached the end of the input buffer
   * @return {Boolean}
   */
  get eof() {
    return this._index === this._length;
  }

  /**
   * Advance reader position, check padding and overflow
   * @param {Number} size - Bytes to read
   * @return {Number} Position to read from
   * @private
   */
  advance(size) {
    const from = this._index;
    // advance cursor position
    this._index += size;
    // check buffer boundaries
    if (this._length < this._index)
      throw new XdrReaderError('attempt to read outside the boundary of the buffer');
    // check that padding is correct for Opaque and String
    const padding = 4 - (size % 4 || 4);
    if (padding > 0) {
      for (let i = 0; i < padding; i++)
        if (this._buffer[this._index + i] !== 0) // all bytes in the padding should be zeros
          throw new XdrReaderError('invalid padding');
    }
    return from;
  }

  /**
   * Reset reader position
   * @return {void}
   */
  rewind() {
    this._index = 0
  }

  /**
   * Read byte array from the buffer
   * @param {Number} size - Bytes to read
   * @return {Buffer} - Sliced portion of the underlying buffer
   */
  read(size) {
    return this._buffer.subarray(this.advance(size), this._index);
  }

  /**
   * Read i32 from buffer
   * @return {Number}
   */
  readInt32BE() {
    return this._buffer.readInt32BE(this.advance(4));
  }

  /**
   * Read u32 from buffer
   * @return {Number}
   */
  readUInt32BE() {
    return this._buffer.readUInt32BE(this.advance(4));
  }

  /**
   * Read i64 from buffer
   * @return {BigInt}
   */
  readBigInt64BE() {
    return this._buffer.readBigInt64BE(this.advance(8));
  }

  /**
   * Read u64 from buffer
   * @return {BigInt}
   */
  readBigUInt64BE() {
    return this._buffer.readBigUInt64BE(this.advance(8));
  }

  /**
   * Read float from buffer
   * @return {Number}
   */
  readFloatBE() {
    return this._buffer.readFloatBE(this.advance(4));
  }

  /**
   * Read double from buffer
   * @return {Number}
   */
  readDoubleBE() {
    return this._buffer.readDoubleBE(this.advance(8));
  }
}


/*class Cursor {
  constructor(buffer) {
    if (!(buffer instanceof Buffer)) {
      buffer = typeof buffer === 'number' ? Buffer.alloc(buffer) : Buffer.from(buffer);
    }

    this._setBuffer(buffer);
    this.rewind();
  }

  _setBuffer(buffer) {
    this._buffer = buffer;
    this.length = buffer.length;
  }

  buffer() {
    return this._buffer;
  }

  tap(cb) {
    cb(this);
    return this;
  }

  clone(newIndex) {
    const c = new this.constructor(this.buffer());
    c.seek(arguments.length === 0 ? this.tell() : newIndex);

    return c;
  }

  tell() {
    return this._index;
  }

  seek(op, index) {
    if (arguments.length === 1) {
      index = op;
      op = '=';
    }

    if (op === '+') {
      this._index += index;
    } else if (op === '-') {
      this._index -= index;
    } else {
      this._index = index;
    }

    return this;
  }

  rewind() {
    return this.seek(0);
  }

  eof() {
    return this.tell() === this.buffer().length;
  }

  write(string, length, encoding) {
    return this.seek(
      '+',
      this.buffer().write(string, this.tell(), length, encoding)
    );
  }

  fill(value, length) {
    if (arguments.length === 1) {
      length = this.buffer().length - this.tell();
    }

    this.buffer().fill(value, this.tell(), this.tell() + length);
    this.seek('+', length);

    return this;
  }

  slice(length) {
    if (arguments.length === 0) {
      length = this.length - this.tell();
    }

    const c = new this.constructor(
      this.buffer().slice(this.tell(), this.tell() + length)
    );
    this.seek('+', length);

    return c;
  }

  copyFrom(source) {
    const buf = source instanceof Buffer ? source : source.buffer();
    buf.copy(this.buffer(), this.tell(), 0, buf.length);
    this.seek('+', buf.length);

    return this;
  }

  concat(list) {
    list.forEach((item, i) => {
      if (item instanceof Cursor) {
        list[i] = item.buffer();
      }
    });

    list.unshift(this.buffer());

    const b = Buffer.concat(list);
    this._setBuffer(b);

    return this;
  }

  toString(encoding, length) {
    if (arguments.length === 0) {
      encoding = 'utf8';
      length = this.buffer().length - this.tell();
    } else if (arguments.length === 1) {
      length = this.buffer().length - this.tell();
    }

    const val = this.buffer().toString(
      encoding,
      this.tell(),
      this.tell() + length
    );
    this.seek('+', length);

    return val;
  }

  writeBufferPadded(buffer) {
    const padding = calculatePadding(buffer.length);
    const paddingBuffer = Buffer.alloc(padding);

    return this.copyFrom(new Cursor(buffer)).copyFrom(
      new Cursor(paddingBuffer)
    );
  }
}

[
  [1, ['readInt8', 'readUInt8']],
  [2, ['readInt16BE', 'readInt16LE', 'readUInt16BE', 'readUInt16LE']],
  [
    4,
    [
      'readInt32BE',
      'readInt32LE',
      'readUInt32BE',
      'readUInt32LE',
      'readFloatBE',
      'readFloatLE'
    ]
  ],
  [8, ['readDoubleBE', 'readDoubleLE']]
].forEach((arr) => {
  arr[1].forEach((method) => {
    Cursor.prototype[method] = function read() {
      const val = this.buffer()[method](this.tell());
      this.seek('+', arr[0]);

      return val;
    };
  });
});

[
  [1, ['writeInt8', 'writeUInt8']],
  [2, ['writeInt16BE', 'writeInt16LE', 'writeUInt16BE', 'writeUInt16LE']],
  [
    4,
    [
      'writeInt32BE',
      'writeInt32LE',
      'writeUInt32BE',
      'writeUInt32LE',
      'writeFloatBE',
      'writeFloatLE'
    ]
  ],
  [8, ['writeDoubleBE', 'writeDoubleLE']]
].forEach((arr) => {
  arr[1].forEach((method) => {
    Cursor.prototype[method] = function write(val) {
      this.buffer()[method](val, this.tell());
      this.seek('+', arr[0]);

      return this;
    };
  });
});

export { Cursor };*/
