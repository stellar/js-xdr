import { describe, it, expect } from 'vitest';
import { option, int32 } from '../../src/index.js';
import { bytes, toArray, roundTrip } from './_helpers.js';

const schema = option(int32());

describe('option', () => {
  describe('encode', () => {
    it('writes a present flag plus the value when set', () => {
      expect(toArray(schema.encode(5))).toEqual([0, 0, 0, 1, 0, 0, 0, 5]);
    });

    it('writes only the absent flag for null', () => {
      expect(toArray(schema.encode(null))).toEqual([0, 0, 0, 0]);
    });
  });

  describe('decode', () => {
    it('reads the present flag then the value', () => {
      expect(schema.decode(bytes([0, 0, 0, 1, 0, 0, 0, 5]))).toBe(5);
    });

    it('reads null when the flag is absent', () => {
      expect(schema.decode(bytes([0, 0, 0, 0]))).toBeNull();
    });
  });

  it('round-trips present and absent values', () => {
    expect(roundTrip(schema, 42)).toBe(42);
    expect(roundTrip(schema, null)).toBeNull();
  });
});
