import { describe, it, expect } from 'vitest';
import { struct, int32, bool } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const Range = struct('Range', {
  begin: int32(),
  end: int32(),
  inclusive: bool()
});

describe('struct', () => {
  it('keeps its name', () => {
    expect(Range.name).toBe('Range');
  });

  describe('encode', () => {
    it('writes fields in declaration order', () => {
      expect(
        toArray(Range.encode({ begin: 5, end: 255, inclusive: true }))
      ).toEqual([0, 0, 0, 5, 0, 0, 0, 255, 0, 0, 0, 1]);
    });

    it('throws when a field is missing', () => {
      expect(() => encodeInvalid(Range, { begin: 1, end: 2 })).toThrow(
        /missing struct field/i
      );
    });

    it('throws for non-object input', () => {
      expect(() => encodeInvalid(Range, null)).toThrow(
        /expected plain object/i
      );
      expect(() => encodeInvalid(Range, [])).toThrow(/expected plain object/i);
    });

    it('rejects class instances rather than treating them as plain objects', () => {
      expect(() => encodeInvalid(Range, new Date())).toThrow(
        /expected plain object/i
      );
      expect(() => encodeInvalid(Range, new Map())).toThrow(
        /expected plain object/i
      );
      expect(() => encodeInvalid(Range, new Uint8Array(4))).toThrow(
        /expected plain object/i
      );
    });

    it('accepts objects with a null prototype', () => {
      const value = Object.assign(Object.create(null), {
        begin: 1,
        end: 2,
        inclusive: true
      });
      expect(toArray(Range.encode(value))).toEqual([
        0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1
      ]);
    });

    it('propagates field validation errors', () => {
      expect(() =>
        Range.encode({ begin: 2147483648, end: 0, inclusive: false })
      ).toThrow(/range/i);
    });
  });

  describe('decode', () => {
    it('reads each field in order', () => {
      expect(
        Range.decode(bytes([0, 0, 0, 5, 0, 0, 0, 255, 0, 0, 0, 1]))
      ).toEqual({ begin: 5, end: 255, inclusive: true });
    });
  });

  it('supports nested structs', () => {
    const Line = struct('Line', { a: Range, b: Range });
    const value = {
      a: { begin: 0, end: 1, inclusive: false },
      b: { begin: 2, end: 3, inclusive: true }
    };
    expect(roundTrip(Line, value)).toEqual(value);
  });

  it('round-trips', () => {
    const value = { begin: -1, end: 100, inclusive: false };
    expect(roundTrip(Range, value)).toEqual(value);
  });

  describe('inherited field names', () => {
    it('rejects a field named __proto__ at construction', () => {
      expect(() =>
        struct('Bad', { ['__proto__']: int32(), x: int32() })
      ).toThrow(/'__proto__' is not allowed/);
    });

    it('throws when a field shadowing Object.prototype is missing, rather than encoding the inherited value', () => {
      const Shadow = struct('Shadow', { toString: int32(), x: int32() });
      // `'toString' in value` is true for any plain object; only an
      // own-property check catches the missing field.
      expect(() => encodeInvalid(Shadow, { x: 7 })).toThrow(
        /missing struct field/i
      );
    });

    it('round-trips a provided field that shadows Object.prototype', () => {
      const Shadow = struct('Shadow', { toString: int32(), x: int32() });
      const wire = bytes([0, 0, 0, 5, 0, 0, 0, 7]);
      const decoded = Shadow.decode(wire);
      expect(Object.getOwnPropertyDescriptor(decoded, 'toString')?.value).toBe(
        5
      );
      expect(toArray(Shadow.encode(decoded))).toEqual(Array.from(wire));
    });
  });
});
