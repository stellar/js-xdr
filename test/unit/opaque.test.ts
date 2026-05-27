import { describe, it, expect } from 'vitest';
import { opaque } from '../../src/index.js';
import { bytes, toArray, encodeInvalid } from './_helpers.js';

describe('opaque (fixed-length)', () => {
  describe('encode', () => {
    it('writes exactly length bytes when aligned', () => {
      const schema = opaque(4);
      expect(toArray(schema.encode(bytes([1, 2, 3, 4])))).toEqual([1, 2, 3, 4]);
    });

    it('zero-pads to a 4-byte boundary', () => {
      const schema = opaque(3);
      expect(toArray(schema.encode(bytes([1, 2, 3])))).toEqual([1, 2, 3, 0]);
    });

    it('throws on a length mismatch', () => {
      const schema = opaque(3);
      expect(() => schema.encode(bytes([1, 2]))).toThrow(/expected 3 byte/i);
      expect(() => schema.encode(bytes([1, 2, 3, 4]))).toThrow(
        /expected 3 byte/i
      );
    });

    it('throws for non-Uint8Array input', () => {
      expect(() => encodeInvalid(opaque(2), [1, 2])).toThrow(
        /expected Uint8Array/i
      );
    });
  });

  describe('decode', () => {
    it('reads length bytes and consumes the padding', () => {
      expect(toArray(opaque(4).decode(bytes([1, 2, 3, 4])))).toEqual([
        1, 2, 3, 4
      ]);
      expect(toArray(opaque(3).decode(bytes([1, 2, 3, 0])))).toEqual([1, 2, 3]);
    });

    it('throws on non-zero padding', () => {
      expect(() => opaque(3).decode(bytes([1, 2, 3, 9]))).toThrow(/non-zero/i);
    });
  });
});
