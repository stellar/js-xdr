import { describe, it, expect } from 'vitest';
import { string } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

// `string<N>` is a charset-free primitive: length-prefixed, 4-byte-padded raw
// bytes. Charset handling lives in a higher layer, so the schema operates on
// Uint8Array directly.
const schema = string(100);

describe('string', () => {
  describe('encode', () => {
    it('length-prefixes and pads to a 4-byte boundary', () => {
      expect(toArray(schema.encode(bytes([72, 105])))).toEqual([
        0, 0, 0, 2, 72, 105, 0, 0
      ]);
      expect(toArray(schema.encode(bytes([97, 98, 99, 100])))).toEqual([
        0, 0, 0, 4, 97, 98, 99, 100
      ]);
    });

    it('encodes empty content', () => {
      expect(toArray(schema.encode(bytes([])))).toEqual([0, 0, 0, 0]);
    });

    it('throws when exceeding maxLength', () => {
      expect(() => string(2).encode(bytes([1, 2, 3]))).toThrow(
        /exceeds maximum/i
      );
    });

    it('throws for non-Uint8Array input', () => {
      expect(() => encodeInvalid(schema, 'Hi')).toThrow(/expected Uint8Array/i);
      expect(() => encodeInvalid(schema, 123)).toThrow(/expected Uint8Array/i);
    });
  });

  describe('decode', () => {
    it('reads the length-prefixed payload and consumes padding', () => {
      expect(
        toArray(schema.decode(bytes([0, 0, 0, 2, 72, 105, 0, 0])))
      ).toEqual([72, 105]);
      expect(toArray(schema.decode(bytes([0, 0, 0, 0])))).toEqual([]);
    });

    it('throws when the declared length exceeds maxLength', () => {
      expect(() =>
        string(2).decode(bytes([0, 0, 0, 3, 97, 98, 99, 0]))
      ).toThrow(/exceeds maximum/i);
    });
  });

  it('round-trips arbitrary bytes, including non-UTF-8', () => {
    for (const value of [[], [0], [255], [72, 105], [0xff, 0x00, 0xab]]) {
      expect(toArray(roundTrip(schema, bytes(value)))).toEqual(value);
    }
  });

  describe('validate', () => {
    it('accepts byte arrays within maxLength', () => {
      expect(schema.validate(bytes([1, 2, 3]))).toBe(true);
      expect(schema.validate(bytes([]))).toBe(true);
    });

    it('rejects oversized payloads and non-bytes', () => {
      expect(string(2).validate(bytes([1, 2, 3]))).toBe(false);
      expect(schema.validate('hi')).toBe(false);
      expect(schema.validate(123)).toBe(false);
    });
  });
});
