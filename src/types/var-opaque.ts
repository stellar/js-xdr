import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertLength, assertUint8Array } from '../core/helpers.js';

/**
 * Reads and writes variable-length XDR opaque byte sequences.
 */
class VarOpaqueType extends BaseType<Uint8Array> {
  readonly kind = 'varOpaque';

  constructor(private readonly maxLength: number, name?: string) {
    super(name);
    assertLength(maxLength, 'varOpaque maxLength');
  }

  _read(reader: Reader, path: string): Uint8Array {
    const length = reader.readUint32(path);
    if (length > this.maxLength) {
      throw new XdrError(
        `${path}: opaque length ${length} exceeds maximum ${this.maxLength}`
      );
    }
    const bytes = reader.readBytes(length, path);
    reader.skipPadding(length, path);
    return bytes;
  }

  _write(value: Uint8Array, writer: Writer, path: string): void {
    assertUint8Array(value, path);
    if (value.length > this.maxLength) {
      throw new XdrError(
        `${path}: opaque length ${value.length} exceeds maximum ${this.maxLength}`
      );
    }
    writer.writeUint32(value.length);
    writer.writeBytes(value);
    writer.writePadding(value.length);
  }
}

/**
 * Creates a schema for an XDR variable-length opaque byte sequence.
 *
 * Values are `Uint8Array`s with length at most `maxLength`. The wire format is
 * a uint32 byte length, the raw bytes, then zero padding to a 4-byte boundary.
 */
export function varOpaque(
  maxLength: number,
  name?: string
): XdrType<Uint8Array> {
  return new VarOpaqueType(maxLength, name);
}
