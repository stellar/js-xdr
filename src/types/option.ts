import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type Infer, type XdrType } from '../core/xdr-type.js';
import { BOOL_TYPE } from './bool.js';

/**
 * Reads and writes XDR optional values.
 */
class OptionType<T> extends BaseType<T | null> {
  readonly kind = 'option';
  readonly element: XdrType<T>;

  constructor(element: XdrType<T>) {
    super();
    this.element = element;
  }

  _read(reader: Reader, path: string): T | null {
    reader.enter(path);
    try {
      const present = BOOL_TYPE._read(reader, `${path}.present`);
      if (!present) {
        return null;
      }
      const value = this.element._read(reader, `${path}.value`);
      // A present option whose element decoded to `null` is indistinguishable
      // from an absent one, so the same value would have two wire forms and
      // re-encoding would not reproduce these bytes. Both forms are valid XDR;
      // it is the representation here that cannot hold them apart, so reject
      // these bytes rather than silently collapsing them into the shorter form.
      if (value === null) {
        throw new XdrError(
          `${path}: present option decoded to null, which is how an absent ` +
            `option is represented; wrap the element in a single-field ` +
            `struct to distinguish the two`
        );
      }
      return value;
    } finally {
      reader.exit();
    }
  }

  _write(value: T | null, writer: Writer, path: string): void {
    writer.enter(path);
    try {
      BOOL_TYPE._write(value !== null, writer, `${path}.present`);
      if (value !== null) {
        this.element._write(value, writer, `${path}.value`);
      }
    } finally {
      writer.exit();
    }
  }
}

/**
 * Creates a schema for an XDR optional value.
 *
 * Values are represented as either the element value or `null`. The wire format
 * writes a boolean presence flag first; when the flag is `true`, the element
 * value follows.
 *
 * Because `null` marks absence, the element type must never decode to `null`
 * itself — the two would be the same JavaScript value. Decoding a present
 * option whose element produced `null` throws rather than collapsing the two
 * forms. This rules out a nested optional, and also a custom type that uses
 * `null` as an inhabited value (a JSON-style schema with a null arm, say).
 *
 * Both are still expressible: put a single-field struct between the two
 * levels. `option(struct('Wrapped', { value: option(int32()) }))` has the same
 * wire format as a nested optional and maps each of the three forms to a
 * distinct value — `null`, `{ value: null }`, `{ value: 7 }`.
 */
export function option<T extends XdrType<unknown>>(
  element: T
): OptionSchema<Infer<T> | null> {
  // An absent outer option and a present-but-absent inner one would both map to
  // JS `null`, giving one value two wire encodings (and a lossy re-encode). The
  // wire form is legal XDR — RFC 4506 reaches it through a typedef — so this is
  // a limit of the representation here, not of the format.
  //
  // This is an early, clearer error for the obvious case; it is not the
  // enforcement point. The element can reach `null` through a `lazy` wrapper or
  // a custom type, neither of which this check can see, so `_read` rejects a
  // present option that decoded to `null` whatever produced it.
  if (element.kind === 'option') {
    throw new XdrError(
      'option: cannot nest option directly inside option, since an absent ' +
        'outer option and a present-but-absent inner one are both `null`; ' +
        'wrap the inner option in a single-field struct instead'
    );
  }
  return new OptionType(element) as unknown as OptionSchema<Infer<T> | null>;
}

/**
 * Public introspection surface of an optional-value schema.
 *
 * Narrow any `XdrType<unknown>` with `schema.kind === 'option'`.
 */
export interface OptionSchema<T> extends XdrType<T> {
  readonly kind: 'option';
  readonly element: XdrType<unknown>;
}
