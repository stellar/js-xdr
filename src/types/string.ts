import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertLength } from '../core/helpers.js';

/**
 * Reads and writes XDR `string<N>` values as bytes.
 *
 * Charset handling is deliberately outside this schema layer.
 */
class StringType extends BaseType<Uint8Array> {
  readonly kind = 'string';

  constructor(private readonly maxLength: number) {
    super();
    assertLength(maxLength, 'string maxLength');
  }

  _read(reader: Reader, path: string): Uint8Array {
    const length = reader.readUint32(path);
    if (length > this.maxLength) {
      throw new XdrError(
        `${path}: string byte length ${length} exceeds maximum ${this.maxLength}`
      );
    }
    const bytes = reader.readBytes(length, path);
    reader.skipPadding(length, path);
    return bytes;
  }

  _write(value: Uint8Array, writer: Writer, path: string): void {
    if (!(value instanceof Uint8Array)) {
      throw new XdrError(`${path}: expected Uint8Array`);
    }
    if (value.length > this.maxLength) {
      throw new XdrError(
        `${path}: string byte length ${value.length} exceeds maximum ${this.maxLength}`
      );
    }
    writer.writeUint32(value.length);
    writer.writeBytes(value);
    writer.writePadding(value.length);
  }
}

/**
 * Creates a schema for an XDR string.
 *
 * Values are raw bytes in a `Uint8Array`, not JavaScript strings. The wire
 * format is a uint32 byte length, the bytes, then zero padding to a 4-byte
 * boundary. Convert text at the boundary with `TextEncoder` and `TextDecoder`.
 *
 * @example
 * ```ts
 * const Name = string(64);
 * const encoded = Name.encode(new TextEncoder().encode('hello'));
 * const value = new TextDecoder().decode(Name.decode(encoded));
 * ```
 */
function string_(maxLength: number): XdrType<Uint8Array> {
  return new StringType(maxLength);
}

export { string_ as string };
