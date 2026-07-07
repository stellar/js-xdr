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
      return present ? this.element._read(reader, `${path}.value`) : null;
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
 */
export function option<T extends XdrType<unknown>>(
  element: T
): XdrType<Infer<T> | null> {
  // An absent outer option and a present-but-null inner option would both map
  // to JS `null`, giving one value two wire encodings (and a lossy re-encode).
  // XDR IDL cannot express a directly nested optional either.
  if (element.kind === 'option') {
    throw new XdrError('option: cannot nest option directly inside option');
  }
  return new OptionType(element) as XdrType<Infer<T> | null>;
}
