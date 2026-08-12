import { describe, it, expect } from 'vitest';
import {
  Reader,
  XdrError,
  array,
  int32,
  opaque,
  string,
  struct,
  varOpaque,
  voidType
} from '../../src/index.js';
import { bytes } from './_helpers.js';

describe('Reader', () => {
  it('reads big-endian values and advances the offset', () => {
    const reader = new Reader(bytes([0, 0, 0, 5, 255, 255, 255, 255]));
    expect(reader.offset).toBe(0);
    expect(reader.readInt32('p')).toBe(5);
    expect(reader.offset).toBe(4);
    expect(reader.readInt32('p')).toBe(-1);
    expect(reader.remaining).toBe(0);
  });

  it('reads 64-bit and floating-point values', () => {
    expect(
      new Reader(bytes([255, 255, 255, 255, 255, 255, 255, 255])).readBigInt64(
        'p'
      )
    ).toBe(-1n);
    expect(new Reader(bytes([0, 0, 0, 0, 0, 0, 0, 1])).readBigUint64('p')).toBe(
      1n
    );
    expect(new Reader(bytes([63, 128, 0, 0])).readFloat32('p')).toBe(1);
    expect(
      new Reader(bytes([63, 240, 0, 0, 0, 0, 0, 0])).readFloat64('p')
    ).toBe(1);
  });

  describe('readBytes', () => {
    it('throws on an invalid length', () => {
      const reader = new Reader(bytes([0, 0, 0, 0]));
      expect(() => reader.readBytes(-1, 'p')).toThrow(/invalid byte length/i);
      expect(() => reader.readBytes(1.5, 'p')).toThrow(/invalid byte length/i);
    });

    it('throws when there is not enough data', () => {
      const reader = new Reader(bytes([0, 0]));
      expect(() => reader.readBytes(4, 'p')).toThrow(/incomplete/i);
    });

    it('returns an exact-size copy for a Buffer input', () => {
      const input = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
      const reader = new Reader(input);
      const out = reader.readBytes(4, 'p');

      expect(Array.from(out)).toEqual([1, 2, 3, 4]);
      expect(out.buffer).not.toBe(input.buffer);
      expect(out.buffer.byteLength).toBe(out.byteLength);

      input.fill(0);
      expect(Array.from(out)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('skipPadding', () => {
    it('consumes the padding bytes for a given length', () => {
      const reader = new Reader(bytes([0, 0, 0]));
      reader.skipPadding(1, 'p');
      expect(reader.remaining).toBe(0);
    });

    it('throws on non-zero padding', () => {
      const reader = new Reader(bytes([0, 9, 0]));
      expect(() => reader.skipPadding(1, 'p')).toThrow(/non-zero/i);
    });
  });

  describe('done', () => {
    it('passes when input is fully consumed', () => {
      expect(() => new Reader(bytes([])).done('p')).not.toThrow();
    });

    it('throws when bytes remain', () => {
      expect(() => new Reader(bytes([1, 2])).done('p')).toThrow(/trailing/i);
    });
  });

  describe('enter / exit depth tracking', () => {
    it('throws once depth exceeds maxDepth', () => {
      const reader = new Reader(bytes([]), 2);
      reader.enter('p');
      reader.enter('p');
      expect(() => reader.enter('p')).toThrow(/max recursion depth/i);
    });

    it('exit frees a level of depth', () => {
      const reader = new Reader(bytes([]), 1);
      reader.enter('p');
      reader.exit();
      expect(() => reader.enter('p')).not.toThrow();
    });
  });

  it('decode honors the maxDepth option', () => {
    const nested = array(array(int32(), 1), 1);
    const wire = bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5]);
    expect(() => nested.decode(wire, { maxDepth: 1 })).toThrow(
      /max recursion depth/i
    );
    expect(nested.decode(wire, { maxDepth: 2 })).toEqual([[5]]);
  });

  it('validateXdr honors the maxDepth option', () => {
    const nested = array(array(int32(), 1), 1);
    const wire = bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5]);
    expect(nested.validateXdr(wire, { maxDepth: 1 })).toBe(false);
    expect(nested.validateXdr(wire, { maxDepth: 2 })).toBe(true);
  });

  // Reader normalizes its input to a plain Uint8Array, so `slice` in
  // readBytes always performs a genuine copy — even when the caller passes a
  // Node Buffer, whose overridden `slice` returns an aliasing view. These
  // tests pin the fixed invariant: decoded byte values never alias the
  // caller's input and never expose an over-wide backing ArrayBuffer (e.g.
  // Node's Buffer pool).
  describe('copies bytes out of subclassed inputs (Buffer et al.)', () => {
    it('varOpaque decoded from a Buffer is an independent copy', () => {
      const schema = varOpaque(1024);
      const wire = Buffer.from([0, 0, 0, 4, 0xaa, 0xbb, 0xcc, 0xdd]);
      const decoded = schema.decode(wire);

      expect(Array.from(decoded)).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
      expect(decoded.buffer).not.toBe(wire.buffer);

      // Mutating the input after decode must not change the decoded value.
      wire.fill(0, 4, 8);
      expect(Array.from(decoded)).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);

      // Mutating the decoded value must not change the input.
      decoded[0] = 0xff;
      expect(wire[4]).toBe(0);
    });

    it('pool-backed Buffer input yields an exact-size backing buffer', () => {
      const schema = varOpaque(1024);
      // seq: length prefix 4, payload [1,2,3,4]
      const b64 = Buffer.from([0, 0, 0, 4, 1, 2, 3, 4]).toString('base64');
      // Buffer.from(b64) draws from Node's shared 8 KiB allocation pool.
      const wire = Buffer.from(b64, 'base64');
      const decoded = schema.decode(wire);

      expect(Array.from(decoded)).toEqual([1, 2, 3, 4]);
      // Exact-size buffer: no pool exposure via decoded.buffer.
      expect(decoded.buffer.byteLength).toBe(decoded.byteLength);
    });

    it('control: plain Uint8Array input still returns an independent copy', () => {
      const schema = varOpaque(1024);
      const wire = new Uint8Array([0, 0, 0, 4, 0xaa, 0xbb, 0xcc, 0xdd]);
      const decoded = schema.decode(wire);

      expect(decoded.buffer).not.toBe(wire.buffer);
      wire.fill(0, 4, 8);
      expect(Array.from(decoded)).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
    });

    it('opaque and string fields in a struct decoded from a Buffer are copies', () => {
      const schema = struct('S', {
        fixed: opaque(4),
        text: string(16)
      });
      const wire = Buffer.from(
        schema.encode({
          fixed: new Uint8Array([9, 8, 7, 6]),
          text: new Uint8Array([0x61, 0x62, 0x63]) // 'abc'
        })
      );
      const decoded = schema.decode(wire);

      expect(Array.from(decoded.fixed)).toEqual([9, 8, 7, 6]);
      expect(Array.from(decoded.text)).toEqual([0x61, 0x62, 0x63]);
      expect(decoded.fixed.buffer).not.toBe(wire.buffer);
      expect(decoded.text.buffer).not.toBe(wire.buffer);

      wire.fill(0xff);
      expect(Array.from(decoded.fixed)).toEqual([9, 8, 7, 6]);
      expect(Array.from(decoded.text)).toEqual([0x61, 0x62, 0x63]);
    });

    it('a Buffer at a non-zero byteOffset decodes the correct window', () => {
      const schema = varOpaque(1024);
      const payload = [0, 0, 0, 4, 0xde, 0xad, 0xbe, 0xef];
      // Place the wire bytes at offset 4 inside a larger buffer, then take a
      // subarray view — a Buffer with byteOffset !== 0 over the same memory.
      const big = Buffer.alloc(16, 0x55);
      big.set(payload, 4);
      const wire = big.subarray(4, 4 + payload.length);
      expect(wire.byteOffset).not.toBe(0);

      const decoded = schema.decode(wire);
      expect(Array.from(decoded)).toEqual([0xde, 0xad, 0xbe, 0xef]);
      expect(decoded.buffer).not.toBe(big.buffer);
    });

    it('SharedArrayBuffer-backed input decodes to a normal exact-size ArrayBuffer', () => {
      const schema = varOpaque(1024);
      const sab = new SharedArrayBuffer(8);
      const wire = new Uint8Array(sab);
      wire.set([0, 0, 0, 4, 0x11, 0x22, 0x33, 0x44]);

      const decoded = schema.decode(wire);
      expect(Array.from(decoded)).toEqual([0x11, 0x22, 0x33, 0x44]);
      expect(decoded.buffer).toBeInstanceOf(ArrayBuffer);
      expect(decoded.buffer.byteLength).toBe(decoded.byteLength);
    });

    it('detached and zero-length inputs keep their current behavior', () => {
      const schema = varOpaque(1024);

      // Detach an ArrayBuffer while holding a view over it; the view then
      // reports byteLength 0 and Reader's zero-length guard must handle it.
      // (structuredClone with transfer detaches; ArrayBuffer.prototype.transfer
      // is untyped under this project's ES2022 lib.)
      const ab = new ArrayBuffer(8);
      const view = new Uint8Array(ab);
      structuredClone(ab, { transfer: [ab] });
      expect(view.byteLength).toBe(0);

      expect(schema.validateXdr(view)).toBe(false); // false, not a TypeError
      expect(() => schema.decode(view)).toThrow(XdrError);

      // A detached *Buffer* is the case that actually exercises the guard: a
      // plain Uint8Array takes the fast path, but a subclass reaches the
      // re-wrap, where constructing over a detached buffer would throw
      // TypeError without the guard.
      const ab2 = new ArrayBuffer(8);
      const detachedBuf = Buffer.from(ab2);
      structuredClone(ab2, { transfer: [ab2] });
      expect(detachedBuf.byteLength).toBe(0);
      expect(schema.validateXdr(detachedBuf)).toBe(false);
      expect(() => schema.decode(detachedBuf)).toThrow(XdrError);

      // Plain zero-length input: an empty schema decodes, a non-empty one
      // throws XdrError — same as today.
      const empty = new Uint8Array(0);
      expect(voidType().decode(empty)).toBeUndefined();
      expect(() => schema.decode(empty)).toThrow(XdrError);
    });

    it('a subclass that shadows `constructor` is still re-wrapped', () => {
      // Distinguishes the prototype-identity check from a naive
      // `bytes.constructor === Uint8Array` check, which this subclass passes
      // while keeping an aliasing `slice`. defineProperty (instead of class
      // method syntax) sidesteps TS override typing; the runtime shape is the
      // same.
      class Evil extends Uint8Array {}
      Object.defineProperty(Evil.prototype, 'slice', {
        value: Uint8Array.prototype.subarray
      });
      Object.defineProperty(Evil.prototype, 'constructor', {
        value: Uint8Array
      });

      const schema = varOpaque(1024);
      const backing = new Uint8Array([0, 0, 0, 4, 0xaa, 0xbb, 0xcc, 0xdd]);
      const wire = new Evil(backing.buffer, 0, backing.byteLength);
      const decoded = schema.decode(wire);

      expect(Array.from(decoded)).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
      expect(decoded.buffer).not.toBe(wire.buffer);
      wire.fill(0, 4, 8);
      expect(Array.from(decoded)).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
    });
  });
});
