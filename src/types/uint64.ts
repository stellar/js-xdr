import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';
import { assertBigIntRange } from '../core/helpers.js';

/**
 * Reads and writes unsigned 64-bit XDR integers.
 */
class UHyperType extends BaseType<bigint> {
  readonly kind = 'uint64';

  _read(reader: Reader, path: string): bigint {
    return reader.readBigUint64(path);
  }

  _write(value: bigint, writer: Writer, path: string): void {
    assertBigIntRange(value, 0n, (1n << 64n) - 1n, path);
    writer.writeBigUint64(value);
  }
}

/**
 * Creates a schema for an unsigned 64-bit XDR integer.
 *
 * Values are native `bigint`s in the inclusive range
 * `0n..(2n ** 64n - 1n)`. Encoding rejects numbers, strings, and out-of-range
 * bigint values.
 */
export function uint64(): XdrType<bigint> {
  return new UHyperType();
}
