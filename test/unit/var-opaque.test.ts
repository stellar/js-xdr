import { describe, it, expect } from 'vitest';
import { varOpaque } from '../../src/index.js';
import { bytes, toArray, encodeInvalid } from './_helpers.js';

const schema = varOpaque(100);

describe('varOpaque (variable-length)', () => {
  describe('encode', () => {
    it('length-prefixes and pads to a 4-byte boundary', () => {
      expect(toArray(schema.encode(bytes([1, 2, 3])))).toEqual([
        0, 0, 0, 3, 1, 2, 3, 0
      ]);
      expect(toArray(schema.encode(bytes([1, 2, 3, 4])))).toEqual([
        0, 0, 0, 4, 1, 2, 3, 4
      ]);
    });

    it('encodes empty data', () => {
      expect(toArray(schema.encode(bytes([])))).toEqual([0, 0, 0, 0]);
    });

    it('throws when exceeding maxLength', () => {
      expect(() => varOpaque(2).encode(bytes([1, 2, 3]))).toThrow(
        /exceeds maximum/i
      );
    });

    it('throws for non-Uint8Array input', () => {
      expect(() => encodeInvalid(schema, [1, 2, 3])).toThrow(
        /expected Uint8Array/i
      );
    });
  });

  describe('decode', () => {
    it('reads the length-prefixed payload and consumes padding', () => {
      expect(toArray(schema.decode(bytes([0, 0, 0, 3, 1, 2, 3, 0])))).toEqual([
        1, 2, 3
      ]);
      expect(toArray(schema.decode(bytes([0, 0, 0, 0])))).toEqual([]);
    });

    it('throws when the declared length exceeds maxLength', () => {
      expect(() =>
        varOpaque(2).decode(bytes([0, 0, 0, 3, 1, 2, 3, 0]))
      ).toThrow(/exceeds maximum/i);
    });
  });

  describe('padding and length bounds', () => {
    it('rejects non-zero padding bytes on decode', () => {
      expect(() => schema.decode(bytes([0, 0, 0, 1, 9, 0, 0, 5]))).toThrow(
        /non-zero XDR padding/i
      );
    });

    it('accepts a value exactly at maxLength on encode and decode', () => {
      const atMax = varOpaque(2);
      const wire = bytes([0, 0, 0, 2, 9, 8, 0, 0]);
      expect(toArray(atMax.encode(bytes([9, 8])))).toEqual(Array.from(wire));
      expect(toArray(atMax.decode(wire))).toEqual([9, 8]);
    });

    it('validateXdr agrees with decode for good and bad bytes', () => {
      const atMax = varOpaque(2);
      expect(atMax.validateXdr(bytes([0, 0, 0, 2, 9, 8, 0, 0]))).toBe(true);
      expect(atMax.validateXdr(bytes([0, 0, 0, 3, 9, 8, 7, 0]))).toBe(false);
      expect(atMax.validateXdr(bytes([0, 0, 0, 2, 9, 8, 0, 5]))).toBe(false);
      expect(atMax.validateXdr(bytes([0, 0, 0, 2, 9]))).toBe(false);
    });
  });
});
