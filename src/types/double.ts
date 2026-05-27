import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertFiniteNumber } from '../core/helpers.js';

/**
 * Reads and writes XDR double-precision floating point values.
 */
class DoubleType extends BaseType<number> {
  readonly kind = 'double';

  _read(reader: Reader, path: string): number {
    return reader.readFloat64(path);
  }

  _write(value: number, writer: Writer, path: string): void {
    assertFiniteNumber(value, path);
    writer.writeFloat64(value);
  }
}

/**
 * Creates a schema for the XDR double-precision floating point primitive.
 *
 * Values are finite JavaScript numbers encoded as IEEE-754 binary64 values.
 * Encoding rejects `NaN`, `Infinity`, and `-Infinity`.
 */
export function double(): XdrType<number> {
  return new DoubleType();
}
