import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertIntRange } from '../core/helpers.js';

/**
 * Reads and writes unsigned 32-bit XDR integers.
 */
class UIntType extends BaseType<number> {
  readonly kind = 'uint32';

  _read(reader: Reader, path: string): number {
    return reader.readUint32(path);
  }

  _write(value: number, writer: Writer, path: string): void {
    assertIntRange(value, 0, 4294967295, path);
    writer.writeUint32(value);
  }
}

/**
 * Creates a schema for an unsigned 32-bit XDR integer.
 *
 * Values are JavaScript numbers in the inclusive range `0..4294967295`.
 * Encoding rejects non-integers and out-of-range values.
 */
export function uint32(): XdrType<number> {
  return new UIntType();
}
