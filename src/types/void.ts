import { XdrError } from '../core/error.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';

/**
 * Reads and writes the XDR void type.
 */
class VoidType extends BaseType<void> {
  readonly kind = 'void';

  _read(): void {
    return undefined;
  }

  _write(value: void, _writer: Writer, path: string): void {
    if (value !== undefined) {
      throw new XdrError(`${path}: expected void`);
    }
  }
}

/**
 * Creates a schema for the XDR void type.
 *
 * The only valid JavaScript value is `undefined`, and the wire representation
 * is zero bytes. This is most often used for void union arms.
 */
function void_(): XdrType<void> {
  return new VoidType();
}

export { void_ as void };
