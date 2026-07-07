import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertNumber } from '../core/helpers.js';

/**
 * Reads and writes XDR single-precision floating point values.
 */
class FloatType extends BaseType<number> {
  readonly kind = 'float';

  _read(reader: Reader, path: string): number {
    return reader.readFloat32(path);
  }

  _write(value: number, writer: Writer, path: string): void {
    assertNumber(value, path);
    writer.writeFloat32(value);
  }
}

/**
 * Creates a schema for the XDR single-precision floating point primitive.
 *
 * Values are JavaScript numbers encoded as IEEE-754 binary32 values. `NaN`,
 * `Infinity`, and `-Infinity` are valid IEEE-754 values and round-trip; `NaN`
 * always encodes as the canonical quiet NaN, so NaN payload bits from decoded
 * input are not preserved on re-encode.
 */
export function float(): XdrType<number> {
  return new FloatType();
}
