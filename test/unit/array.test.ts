import { describe, it, expect } from 'vitest';
import { array, int32 } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = array(int32(), 3);

describe('array (variable-length)', () => {
  describe('encode', () => {
    it('writes a length prefix followed by each element', () => {
      expect(toArray(schema.encode([1, 2, 3]))).toEqual([
        0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3
      ]);
    });

    it('encodes an empty array', () => {
      expect(toArray(schema.encode([]))).toEqual([0, 0, 0, 0]);
    });

    it('throws when exceeding maxLength', () => {
      expect(() => schema.encode([1, 2, 3, 4])).toThrow(/exceeds maximum/i);
    });

    it('throws for non-array input', () => {
      expect(() => encodeInvalid(schema, 'nope')).toThrow(/expected array/i);
    });
  });

  describe('decode', () => {
    it('reads the length prefix then the elements', () => {
      expect(
        schema.decode(bytes([0, 0, 0, 2, 0, 0, 0, 7, 0, 0, 0, 8]))
      ).toEqual([7, 8]);
      expect(schema.decode(bytes([0, 0, 0, 0]))).toEqual([]);
    });

    it('throws when the declared length exceeds maxLength', () => {
      expect(() =>
        schema.decode(bytes([0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 2]))
      ).toThrow(/exceeds maximum/i);
    });
  });

  it('round-trips element values', () => {
    expect(roundTrip(schema, [10, 20, 30])).toEqual([10, 20, 30]);
  });
});
