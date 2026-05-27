import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type Infer, type XdrType } from '../core/xdr-type.js';
import { isPlainObject } from '../core/helpers.js';

/**
 * Reads and writes XDR structs.
 *
 * Runtime values are plain objects; there are no generated accessor classes.
 */
class StructType<
  Shape extends Record<string, XdrType<unknown>>
> extends BaseType<{
  readonly [K in keyof Shape]: Infer<Shape[K]>;
}> {
  readonly kind = 'struct';
  // Ordered [fieldName, schema] pairs. Public so the generic toJson/fromJson
  // walker can introspect struct shape without going through internals.
  readonly entries: ReadonlyArray<readonly [string, XdrType<unknown>]>;

  constructor(name: string, fields: Shape) {
    super(name);
    this.entries = Object.entries(fields) as [string, XdrType<unknown>][];
  }

  _read(
    reader: Reader,
    path: string
  ): { readonly [K in keyof Shape]: Infer<Shape[K]> } {
    reader.enter(path);
    try {
      const value: Record<string, unknown> = {};
      for (const [key, schema] of this.entries) {
        value[key] = schema._read(reader, `${path}.${key}`);
      }
      return value as { readonly [K in keyof Shape]: Infer<Shape[K]> };
    } finally {
      reader.exit();
    }
  }

  _write(
    value: { readonly [K in keyof Shape]: Infer<Shape[K]> },
    writer: Writer,
    path: string
  ): void {
    if (!isPlainObject(value)) {
      throw new XdrError(`${path}: expected plain object`);
    }
    const record = value as Record<string, unknown>;
    for (const [key, schema] of this.entries) {
      if (!(key in record)) {
        throw new XdrError(`${path}.${key}: missing struct field`);
      }
      schema._write(record[key], writer, `${path}.${key}`);
    }
  }
}

/**
 * Creates a schema for an XDR struct.
 *
 * Values are plain JavaScript objects whose properties match the `fields`
 * object. Fields are encoded in the insertion order of `fields`, so declare
 * them in wire order. Encoding rejects missing fields and non-object values.
 *
 * @example
 * ```ts
 * const Color = struct('Color', {
 *   red: uint32(),
 *   green: uint32(),
 *   blue: uint32(),
 * });
 *
 * Color.encode({ red: 1, green: 2, blue: 3 });
 * ```
 */
export function struct<
  Name extends string,
  Shape extends Record<string, XdrType<unknown>>
>(
  name: Name,
  fields: Shape
): XdrType<{ readonly [K in keyof Shape]: Infer<Shape[K]> }> & {
  readonly name: Name;
} {
  return new StructType(name, fields) as unknown as XdrType<{
    readonly [K in keyof Shape]: Infer<Shape[K]>;
  }> & {
    readonly name: Name;
  };
}
