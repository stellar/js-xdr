import { describe, it, expect } from 'vitest';
import { array, int32, void as voidType, XdrError } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

// The documented unbounded idiom array(elem, UNBOUNDED_MAX_LENGTH).
const UNBOUNDED_MAX_LENGTH = 4294967295;

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

    it('rejects a declared element count larger than the remaining input', () => {
      // Declares 10 elements but only 4 element bytes follow: the count cannot
      // be backed by the input, so fail fast before the element loop.
      const wide = array(int32(), 100);
      const input = bytes([0, 0, 0, 10, 0, 0, 0, 1]);
      expect(() => wide.decode(input)).toThrow(XdrError);
      expect(() => wide.decode(input)).toThrow(/exceeds remaining/i);
    });

    it('does not loop or allocate unbounded for a huge count of zero-width elements', () => {
      // Regression for the element-count DoS: array(void, MAX) declaring
      // 0xFFFFFFFF elements from a 4-byte input must fail fast with an
      // XdrError, not spin/OOM or throw a native RangeError.
      const voidArray = array(voidType(), UNBOUNDED_MAX_LENGTH);
      const input = bytes([0xff, 0xff, 0xff, 0xff]);

      let caught: unknown;
      try {
        voidArray.decode(input);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(XdrError);
      expect(caught).not.toBeInstanceOf(RangeError);
    });

    it('still decodes a zero-width-element array whose count fits the input', () => {
      // A genuine (if degenerate) zero-width array round-trips: length 0 needs
      // no element bytes.
      const voidArray = array(voidType(), 8);
      expect(voidArray.decode(bytes([0, 0, 0, 0]))).toEqual([]);
      expect(toArray(voidArray.encode([]))).toEqual([0, 0, 0, 0]);
    });
  });

  it('round-trips element values', () => {
    expect(roundTrip(schema, [10, 20, 30])).toEqual([10, 20, 30]);
  });
});
