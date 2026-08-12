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
      // The length is schema-declared rather than wire-supplied, but the
      // same fail-fast as `array` applies: every element consumes at least
      // one byte, so a length above the bytes remaining can never be
      // satisfied.
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
): FixedArraySchema<Infer<T>[]> {
  return new FixedArrayType(element, length) as unknown as FixedArraySchema<
    Infer<T>[]
  >;
}

/**
 * Public introspection surface of a fixed-length array schema.
 *
 * Narrow any `XdrType<unknown>` with `schema.kind === 'fixedArray'`.
 */
export interface FixedArraySchema<T> extends XdrType<T> {
  readonly kind: 'fixedArray';
  readonly element: XdrType<unknown>;
  readonly length: number;
}
