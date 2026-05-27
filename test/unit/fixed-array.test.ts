import { describe, it, expect } from 'vitest';
import { fixedArray, int32 } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = fixedArray(int32(), 3);

describe('fixedArray (fixed-length)', () => {
  describe('encode', () => {
    it('writes each element with no length prefix', () => {
      expect(toArray(schema.encode([1, 2, 3]))).toEqual([
        0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3
      ]);
    });

    it('throws on a length mismatch', () => {
      expect(() => schema.encode([1, 2])).toThrow(
        /expected array length 3, got 2/i
      );
      expect(() => schema.encode([1, 2, 3, 4])).toThrow(
        /expected array length 3, got 4/i
      );
    });

    it('throws for non-array input', () => {
      expect(() => encodeInvalid(schema, null)).toThrow(/expected array/i);
    });
  });

  describe('decode', () => {
    it('reads exactly length elements', () => {
      expect(
        schema.decode(bytes([0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6]))
      ).toEqual([4, 5, 6]);
    });
  });

  it('round-trips element values', () => {
    expect(roundTrip(schema, [10, 20, 30])).toEqual([10, 20, 30]);
  });
});
