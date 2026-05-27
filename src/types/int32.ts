import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertIntRange } from '../core/helpers.js';

/**
 * Reads and writes signed 32-bit XDR integers.
 */
class IntType extends BaseType<number> {
  readonly kind = 'int32';

  _read(reader: Reader, path: string): number {
    return reader.readInt32(path);
  }

  _write(value: number, writer: Writer, path: string): void {
    assertIntRange(value, -2147483648, 2147483647, path);
    writer.writeInt32(value);
  }
}

/**
 * Creates a schema for a signed 32-bit XDR integer.
 *
 * Values are JavaScript numbers in the inclusive range
 * `-2147483648..2147483647`. Encoding rejects non-integers and out-of-range
 * values.
 */
export function int32(): XdrType<number> {
  return new IntType();
}
