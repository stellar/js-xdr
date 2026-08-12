import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type Infer, type XdrType } from '../core/xdr-type.js';
import { assertArray, assertLength } from '../core/helpers.js';

/**
 * Reads and writes an XDR variable-length array body.
 */
class ArrayType<T> extends BaseType<T[]> {
  readonly kind = 'array';
  readonly element: XdrType<T>;
  readonly maxLength: number;

  constructor(element: XdrType<T>, maxLength: number) {
    super();
    assertLength(maxLength, 'array maxLength');
    this.element = element;
    this.maxLength = maxLength;
  }

  _read(reader: Reader, path: string): T[] {
    reader.enter(path);
    try {
      const length = reader.readUint32(path);
      if (length > this.maxLength) {
        throw new XdrError(
          `${path}: array length ${length} exceeds maximum ${this.maxLength}`
        );
      }
      // Every element consumes at least one byte (`readArray` rejects any
      // element that does not, at the first one). A count above the bytes
      // remaining can therefore never be satisfied, so fail before decoding
      // any elements.
      if (length > reader.remaining) {
        throw new XdrError(
          `${path}: array length ${length} exceeds remaining ${reader.remaining} byte(s)`
        );
      }
      return readArray(reader, length, this.element, path);
    } finally {
      reader.exit();
    }
  }

  _write(value: T[], writer: Writer, path: string): void {
    writer.enter(path);
    try {
      assertArray(value, path);
      if (value.length > this.maxLength) {
        throw new XdrError(
          `${path}: array length ${value.length} exceeds maximum ${this.maxLength}`
        );
      }
      writer.writeUint32(value.length);
      writeArray(value, writer, this.element, path);
    } finally {
      writer.exit();
    }
  }
}

/**
 * Creates a schema for an XDR variable-length array.
 *
 * Values are JavaScript arrays. On the wire, the array is encoded as a uint32
 * element count followed by each element. Encoding and decoding reject lengths
 * greater than `maxLength`.
 *
 * Use `fixedArray` for XDR arrays with a compile-time length and no length
 * prefix.
 */
export function array<T extends XdrType<unknown>>(
  element: T,
  maxLength: number
): ArraySchema<Infer<T>[]> {
  return new ArrayType(element, maxLength) as unknown as ArraySchema<
    Infer<T>[]
  >;
}

/**
 * Public introspection surface of a variable-length array schema.
 *
 * Narrow any `XdrType<unknown>` with `schema.kind === 'array'`.
 */
export interface ArraySchema<T> extends XdrType<T> {
  readonly kind: 'array';
  readonly element: XdrType<unknown>;
  readonly maxLength: number;
}

/**
 * Reads `length` array elements without reading a length prefix.
 *
 * This is a schema-composition helper used by `array` and `fixedArray`;
 * application code should normally use `schema.decode(bytes)`.
 */
export function readArray<T>(
  reader: Reader,
  length: number,
  element: XdrType<T>,
  path: string
): T[] {
  const values: T[] = [];
  for (let i = 0; i < length; i += 1) {
    const before = reader.offset;
    const value = element._read(reader, `${path}[${i}]`);
    // Every element must consume input. Otherwise the element count alone
    // decides how much memory this loop allocates, and `length` comes off
    // the wire. This rejects any element type that encodes to zero bytes:
    // `void`, `opaque(0)`, a struct whose fields are all of those, or a
    // custom `XdrType` that reads nothing.
    if (reader.offset === before) {
      throw new XdrError(
        `${path}[${i}]: element type '${
          element.name ?? element.kind
        }' consumed no input; an array element must encode to at least one byte`
      );
    }
    values.push(value);
  }
  return values;
}

/**
 * Writes array elements without writing a length prefix.
 *
 * This is a schema-composition helper used by `array` and `fixedArray`;
 * application code should normally use `schema.encode(value)`.
 */
export function writeArray<T>(
  values: T[],
  writer: Writer,
  element: XdrType<T>,
  path: string
): void {
  let i = 0;
  for (const value of values) {
    const before = writer.offset;
    element._write(value, writer, `${path}[${i}]`);
    // The mirror of the check in `readArray`. Without it an array of a
    // zero-width element type would encode to bytes that cannot decode back.
    if (writer.offset === before) {
      throw new XdrError(
        `${path}[${i}]: element type '${
          element.name ?? element.kind
        }' encoded to zero bytes; an array element must encode to at least one byte`
      );
    }
    i += 1;
  }
}
