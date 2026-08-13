import { describe, it, expect } from 'vitest';
import { option, int32, lazy, struct, BaseType } from '../../src/index.js';
import type { Reader, Writer, XdrType } from '../../src/index.js';
import { bytes, toArray, roundTrip } from './_helpers.js';

const schema = option(int32());

describe('option', () => {
  describe('encode', () => {
    it('writes a present flag plus the value when set', () => {
      expect(toArray(schema.encode(5))).toEqual([0, 0, 0, 1, 0, 0, 0, 5]);
    });

    it('writes a present flag plus a zero value, not the absent flag', () => {
      expect(toArray(schema.encode(0))).toEqual([0, 0, 0, 1, 0, 0, 0, 0]);
    });

    it('writes only the absent flag for null', () => {
      expect(toArray(schema.encode(null))).toEqual([0, 0, 0, 0]);
    });
  });

  describe('decode', () => {
    it('reads the present flag then the value', () => {
      expect(schema.decode(bytes([0, 0, 0, 1, 0, 0, 0, 5]))).toBe(5);
    });
    it('reads a present zero value, not null', () => {
      expect(schema.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toBe(0);
    });
    it('reads null when the flag is absent', () => {
      expect(schema.decode(bytes([0, 0, 0, 0]))).toBeNull();
    });
  });

  it('round-trips present and absent values', () => {
    expect(roundTrip(schema, 42)).toBe(42);
    expect(roundTrip(schema, null)).toBeNull();
  });

  it('rejects a directly nested option at construction', () => {
    // Absent-outer and present-but-null-inner would both decode to `null`,
    // giving one JS value two wire encodings.
    expect(() => option(option(int32()))).toThrow(/cannot nest option/i);
  });

  describe('present-but-null decode', () => {
    // The construction check above only sees the element's own `kind`, so it
    // cannot catch an element that reaches `null` indirectly. `_read` rejects
    // the collapsed form instead, whatever produced it.

    it('rejects a nested option reached through lazy', () => {
      const nested = option(lazy(() => option(int32())));

      expect(nested.decode(bytes([0, 0, 0, 0]))).toBeNull();
      // Match the message, not just `XdrError`: trailing-byte and depth
      // failures raise the same class.
      expect(() => nested.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toThrow(
        /present option decoded to null/
      );
      // A present, non-null value still decodes through the wrapper.
      expect(nested.decode(bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 7]))).toBe(
        7
      );
    });

    it('rejects a custom element type that decodes to null', () => {
      class NullableInt extends BaseType<number | null> {
        readonly kind = 'custom';

        _read(reader: Reader, path: string): number | null {
          return reader.readInt32(path) === 0 ? null : reader.readInt32(path);
        }

        _write(value: number | null, writer: Writer): void {
          writer.writeInt32(value === null ? 0 : 1);
          if (value !== null) {
            writer.writeInt32(value);
          }
        }
      }

      const schema = option(new NullableInt());

      expect(schema.decode(bytes([0, 0, 0, 0]))).toBeNull();
      expect(() => schema.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toThrow(
        /present option decoded to null/
      );
    });

    it('accepts a null nested one level deeper, which is unambiguous', () => {
      // `null` and `{ x: null }` are distinct JS values with distinct wires,
      // so the check must not fire here. This is also the documented way to
      // exchange a nested optional with a peer: the struct costs no bytes, so
      // the three wire forms below are exactly those of `option(option(x))`,
      // and each maps to its own JS value and round-trips.
      const schema = option(struct('S', { x: option(int32()) }));

      expect(schema.decode(bytes([0, 0, 0, 0]))).toBeNull();
      expect(schema.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toEqual({
        x: null
      });
      expect(
        schema.decode(bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 7]))
      ).toEqual({ x: 7 });

      expect(roundTrip(schema, null)).toBeNull();
      expect(roundTrip(schema, { x: null })).toEqual({ x: null });
      expect(roundTrip(schema, { x: 7 })).toEqual({ x: 7 });
    });

    it('accepts the recursive lazy idiom', () => {
      const node: XdrType<unknown> = struct('Node', {
        value: int32(),
        next: option(lazy((): XdrType<unknown> => node))
      });

      expect(node.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toEqual({
        value: 1,
        next: null
      });
    });
  });
});
