import { describe, it, expect } from 'vitest';
import { enumType } from '../../src/index.js';
import { bytes, toArray, encodeInvalid } from './_helpers.js';

const Color = enumType('Color', { red: 0, green: 1, blue: 2 });

describe('enum', () => {
  it('exposes members as numeric properties and keeps its name', () => {
    expect(Color.red).toBe(0);
    expect(Color.green).toBe(1);
    expect(Color.blue).toBe(2);
    expect(Color.name).toBe('Color');
  });

  describe('encode', () => {
    it('writes the member value as an int32', () => {
      expect(toArray(Color.encode(Color.red))).toEqual([0, 0, 0, 0]);
      expect(toArray(Color.encode(Color.blue))).toEqual([0, 0, 0, 2]);
    });

    it('throws on an unknown value', () => {
      expect(() => Color.encode(9)).toThrow(/unknown enum value/i);
      expect(() => encodeInvalid(Color, 'red')).toThrow(/unknown enum value/i);
    });
  });

  describe('decode', () => {
    it('reads a known member value', () => {
      expect(Color.decode(bytes([0, 0, 0, 1]))).toBe(1);
    });

    it('throws on an unknown value', () => {
      expect(() => Color.decode(bytes([0, 0, 0, 9]))).toThrow(
        /unknown enum value/i
      );
    });
  });

  describe('validate', () => {
    it('accepts known members and rejects everything else', () => {
      expect(Color.validate(0)).toBe(true);
      expect(Color.validate(2)).toBe(true);
      expect(Color.validate(9)).toBe(false);
      expect(Color.validate('red')).toBe(false);
    });
  });

  describe('construction', () => {
    it('rejects duplicate values', () => {
      expect(() => enumType('Dup', { a: 0, b: 0 })).toThrow(/duplicate/i);
    });

    it('rejects member names that collide with reserved properties', () => {
      expect(() => enumType('Bad', { name: 0 })).toThrow(/reserved/i);
      expect(() => enumType('Bad', { decode: 1 })).toThrow(/reserved/i);
    });

    it('rejects member values outside the int32 range', () => {
      // 4294967295 would silently encode as -1 via DataView.setInt32.
      expect(() => enumType('TooBig', { a: 4294967295 })).toThrow(/range/i);
      expect(() => enumType('TooSmall', { a: -2147483649 })).toThrow(/range/i);
    });

    it('rejects non-integer member values', () => {
      expect(() => enumType('Frac', { a: 1.5 })).toThrow(/integer/i);
    });

    it('accepts the int32 boundary values', () => {
      expect(() =>
        enumType('Bounds', { lo: -2147483648, hi: 2147483647 })
      ).not.toThrow();
    });
  });
});
