import { XdrReader } from './serialization/xdr-reader';
import { XdrWriter } from './serialization/xdr-writer';
import { XdrNotImplementedDefinitionError, XdrReaderError } from './errors';

class XdrType {

  /**
   * Encode value to XDR format
   * @param {XdrEncodingFormat} [format] - Encoding format (one of "raw", "hex", "base64")
   * @return {String|Buffer}
   */
  toXDR(format = 'raw') {
    const buffer = this.constructor.toXDR(this);
    switch (format) {
      case 'raw':
        return buffer;
      case 'hex':
        return buffer.toString('hex');
      case 'base64':
        return buffer.toString('base64');
      default:
        throw new TypeError(`Invalid format ${format}, must be "raw", "hex", "base64"`);
    }
  }

  /**
   * Encode value to XDR format
   * @param {XdrPrimitiveType} value - Value to serialize
   * @return {Buffer}
   */
  static toXDR(value) {
    const writer = new XdrWriter();
    this.write(value, writer);
    return writer.finalize();
  }

  /**
   * Check whether input contains a valid XDR-encoded value
   * @param {Buffer|String} input - XDR-encoded input data
   * @param {XdrEncodingFormat} [format] - Encoding format (one of "raw", "hex", "base64")
   * @return {Boolean}
   */
  static fromXDR(input, format = 'raw') {
    let buffer;
    switch (format) {
      case 'raw':
        buffer = input;
        break;
      case 'hex':
        buffer = Buffer.from(input, 'hex');
        break;
      case 'base64':
        buffer = Buffer.from(input, 'base64');
        break;
      default:
        throw new XdrReaderError(`invalid format ${format}, must be "raw", "hex", "base64"`);
    }

    const reader = new XdrReader(buffer);
    const result = this.read(reader);

    if (!reader.eof)
      throw new XdrReaderError(`invalid XDR contract typecast - source buffer not entirely consumed`);

    return result;
  }

  /**
   * Check whether input contains a valid XDR-encoded value
   * @param {Buffer|String} input - XDR-encoded input data
   * @param {XdrEncodingFormat} [format] - Encoding format (one of "raw", "hex", "base64")
   * @return {Boolean}
   */
  static validateXDR(input, format = 'raw') {
    try {
      this.fromXDR(input, format);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export class XdrPrimitiveType extends XdrType {

  /**
   * Read value from the XDR-serialized input
   * @param {XdrReader} reader - XdrReader instance
   * @return {*}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  static read(reader) {
    throw new XdrNotImplementedDefinitionError()
  }

  /**
   * Write XDR value to the buffer
   * @param {*} value - Value to write
   * @param {XdrWriter} writer - XdrWriter instance
   * @return {void}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  static write(value, writer) {
    throw new XdrNotImplementedDefinitionError()
  }

  /**
   * Check whether XDR primitive value is valid
   * @param {XdrType} value - Value to check
   * @return {Boolean}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  static isValid(value) {
    return false;
  }
}

export class XdrCompositeType extends XdrType {
  /**
   * Read value from the XDR-serialized input
   * @param {XdrReader} reader - XdrReader instance
   * @return {*}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  read(reader) {
    throw new XdrNotImplementedDefinitionError()
  }

  /**
   * Write XDR value to the buffer
   * @param {*} value - Value to write
   * @param {XdrWriter} writer - XdrWriter instance
   * @return {void}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  write(value, writer) {
    throw new XdrNotImplementedDefinitionError()
  }

  /**
   * Check whether XDR primitive value is valid
   * @param {XdrType} value - Value to check
   * @return {Boolean}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  isValid(value) {
    return false;
  }
}

/**
 * @typedef {'raw'|'hex'|'base64'} XdrEncodingFormat
 */
