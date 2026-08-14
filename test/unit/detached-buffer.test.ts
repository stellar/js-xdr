import { describe, it, expect } from 'vitest';
import { varOpaque, string, opaque, XdrError } from '../../src/index.js';

/**
 * A Uint8Array whose buffer was detached, or whose span fell out of bounds
 * under a shrunk resizable buffer, keeps its prototype and reports
 * `length === 0`. Such a value must be rejected with an `XdrError` rather than
 * reaching the writer, where reading it raises a native `TypeError`.
 */

function detachedView(byteLength: number): Uint8Array {
  const buffer = new ArrayBuffer(byteLength);
  const view = new Uint8Array(buffer);
  structuredClone(view, { transfer: [buffer] });
  return view;
}

function outOfBoundsView(): Uint8Array {
  // Resizable ArrayBuffers are es2024; the tsconfig lib is ES2022, so reach
  // the constructor options and `resize` through untyped handles.
  const buffer = new (ArrayBuffer as unknown as {
    new (length: number, options: { maxByteLength: number }): ArrayBuffer;
  })(8, { maxByteLength: 8 });
  const view = new Uint8Array(buffer, 4, 4);
  (buffer as unknown as { resize(length: number): void }).resize(0);
  return view;
}

describe('detached and out-of-bounds Uint8Array values', () => {
  const cases = [
    ['detached', detachedView(8)],
    ['out of bounds', outOfBoundsView()]
  ] as const;

  for (const [label, view] of cases) {
    describe(label, () => {
      it('reports length 0 while keeping its prototype', () => {
        expect(view).toBeInstanceOf(Uint8Array);
        expect(view.length).toBe(0);
      });

      it.each([
        ['varOpaque', varOpaque(64)],
        ['string', string(64)],
        ['opaque(0)', opaque(0)]
      ])('%s.validate returns false', (_name, schema) => {
        expect(schema.validate(view)).toBe(false);
      });

      it.each([
        ['varOpaque', varOpaque(64)],
        ['string', string(64)],
        ['opaque(0)', opaque(0)]
      ])('%s.encode throws an XdrError', (_name, schema) => {
        expect(() => schema.encode(view)).toThrow(XdrError);
        expect(() => schema.encode(view)).toThrow(/detached or out of bounds/);
      });
    });
  }

  it('still accepts a legitimately empty Uint8Array', () => {
    expect(varOpaque(64).validate(new Uint8Array(0))).toBe(true);
    expect(string(64).validate(new Uint8Array(0))).toBe(true);
    expect(opaque(0).validate(new Uint8Array(0))).toBe(true);
    expect(varOpaque(64).encode(new Uint8Array(0))).toEqual(
      new Uint8Array([0, 0, 0, 0])
    );
  });

  it('still accepts an empty subarray of a live buffer', () => {
    const empty = new Uint8Array(8).subarray(4, 4);
    expect(varOpaque(64).validate(empty)).toBe(true);
    expect(string(64).validate(empty)).toBe(true);
  });

  it('still rejects a non-Uint8Array with the original message', () => {
    expect(() => varOpaque(64).encode([] as unknown as Uint8Array)).toThrow(
      /expected Uint8Array/
    );
  });
});
