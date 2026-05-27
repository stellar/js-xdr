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
});
