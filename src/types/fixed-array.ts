import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type Infer, type XdrType } from '../core/xdr-type.js';
import { assertArray, assertLength } from '../core/helpers.js';
import { readArray, writeArray } from './array.js';

/**
 * Reads and writes XDR arrays with a fixed element count.
 */
class FixedArrayType<T> extends BaseType<T[]> {
  readonly kind = 'fixedArray';
  readonly element: XdrType<T>;
  readonly length: number;

  constructor(element: XdrType<T>, length: number) {
    super();
    assertLength(length, 'fixedArray length');
    this.element = element;
    this.length = length;
  }

  _read(reader: Reader, path: string): T[] {
    reader.enter(path);
    try {
      // Same guard as `array`: a schema-declared count beyond the remaining
      // input cannot decode, and for zero-width element schemas (void,
      // opaque(0), empty struct) the element loop would otherwise not be
      // bounded by input size at all.
      if (this.length > reader.remaining) {
        throw new XdrError(
          `${path}: array length ${this.length} exceeds remaining ${reader.remaining} byte(s)`
        );
      }
      return readArray(reader, this.length, this.element, path);
    } finally {
      reader.exit();
    }
  }

  _write(value: T[], writer: Writer, path: string): void {
    writer.enter(path);
    try {
      assertArray(value, path);
      if (value.length !== this.length) {
        throw new XdrError(
          `${path}: expected array length ${this.length}, got ${value.length}`
        );
      }
      writeArray(value, writer, this.element, path);
    } finally {
      writer.exit();
    }
  }
}

/**
 * Creates a schema for an XDR fixed-length array.
 *
 * Values are JavaScript arrays whose length must exactly equal `length`. The
 * wire format contains only the element bytes; unlike `array`, no count is
 * encoded.
 */
export function fixedArray<T extends XdrType<unknown>>(
  element: T,
  length: number
): XdrType<Infer<T>[]> {
  return new FixedArrayType(element, length) as XdrType<Infer<T>[]>;
}
