import { describe, it, expect } from 'vitest';
import { BaseType, XdrError, int32 } from '../../src/index.js';
import type { Reader } from '../../src/index.js';
import { bytes } from './_helpers.js';

// A deliberately buggy schema: throws a non-XdrError from both paths.
class BuggyType extends BaseType<number> {
  readonly kind = 'buggy';

  _read(): number {
    throw new TypeError('bug in _read');
  }

  _write(): void {
    throw new TypeError('bug in _write');
  }
}

describe('XdrType contract', () => {
  describe('validate / validateXdr', () => {
    it('return false for values and bytes rejected with XdrError', () => {
      const schema = int32();
      expect(schema.validate('nope')).toBe(false);
      expect(schema.validateXdr(bytes([0, 0]))).toBe(false);
      expect(schema.validate(1)).toBe(true);
      expect(schema.validateXdr(bytes([0, 0, 0, 1]))).toBe(true);
    });

    it('rethrow non-XdrError failures instead of reporting "invalid"', () => {
      const buggy = new BuggyType();
      expect(() => buggy.validate(1)).toThrow(TypeError);
      expect(() => buggy.validateXdr(bytes([0, 0, 0, 1]))).toThrow(TypeError);
    });
  });

  describe('XdrError identity', () => {
    it('matches instanceof for its own instances', () => {
      expect(new XdrError('x')).toBeInstanceOf(XdrError);
    });

    it('matches instanceof across module copies via the name brand', () => {
      // Simulates the dual-package hazard: an XdrError constructed by the
      // other build of this package is a different class with the same brand.
      const foreign = Object.assign(new Error('x'), { name: 'XdrError' });
      expect(foreign instanceof XdrError).toBe(true);
    });

    it('does not match unrelated errors', () => {
      expect(new Error('x') instanceof XdrError).toBe(false);
      expect(new TypeError('x') instanceof XdrError).toBe(false);
    });
  });

  it('decode still enforces read-side maxDepth via DecodeOptions', () => {
    // Sanity check that EncodeOptions did not disturb the decode path.
    class Nest extends BaseType<number> {
      readonly kind = 'nest';
      _read(reader: Reader, path: string): number {
        reader.enter(path);
        try {
          return this._read(reader, path);
        } finally {
          reader.exit();
        }
      }
      _write(): void {}
    }
    expect(() => new Nest().decode(bytes([]), { maxDepth: 5 })).toThrow(
      /max recursion depth 5/i
    );
  });
});
