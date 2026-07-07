import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type Infer, type XdrType } from '../core/xdr-type.js';

/**
 * Defers schema lookup until read/write time.
 */
class LazyType<T> extends BaseType<T> {
  readonly kind = 'lazy';
  readonly getSchema: () => XdrType<T>;

  constructor(getSchema: () => XdrType<T>) {
    super();
    this.getSchema = getSchema;
  }

  _read(reader: Reader, path: string): T {
    reader.enter(path);
    try {
      return this.getSchema()._read(reader, path);
    } finally {
      reader.exit();
    }
  }

  _write(value: T, writer: Writer, path: string): void {
    this.getSchema()._write(value, writer, path);
  }
}

/**
 * Creates a schema that resolves another schema lazily.
 *
 * Use this when a schema needs to reference another schema that is declared
 * later, including self-recursive structures. The callback runs when the value
 * is encoded or decoded, not when the lazy schema is created.
 *
 * @example
 * ```ts
 * type Node = { value: number; next: Node | null };
 * const Node = struct('Node', {
 *   value: int32(),
 *   next: option(lazy(() => Node)),
 * });
 * ```
 */
export function lazy<T extends XdrType<unknown>>(
  getSchema: () => T
): LazySchema<Infer<T>> {
  return new LazyType(() => getSchema()) as unknown as LazySchema<Infer<T>>;
}

/**
 * Public introspection surface of a lazy schema reference.
 *
 * Narrow any `XdrType<unknown>` with `schema.kind === 'lazy'`, then call
 * `getSchema()` to continue walking the resolved schema. Walkers must track
 * visited schemas: recursive types resolve to themselves.
 */
export interface LazySchema<T> extends XdrType<T> {
  readonly kind: 'lazy';
  readonly getSchema: () => XdrType<unknown>;
}
