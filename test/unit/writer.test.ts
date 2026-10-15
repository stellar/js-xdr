import { describe, it, expect } from 'vitest';
import { runInNewContext } from 'node:vm';
import { Writer, XdrError } from '../../src/index.js';
import { bytes, toArray } from './_helpers.js';

describe('Writer', () => {
  it('rejects a non-integer or negative maxDepth', () => {
    expect(() => new Writer(NaN)).toThrow(/invalid maxDepth/i);
    expect(() => new Writer(1.5)).toThrow(/invalid maxDepth/i);
    expect(() => new Writer(-1)).toThrow(/invalid maxDepth/i);
  });

  it('writes big-endian fixed-width integers', () => {
    const writer = new Writer();
    writer.writeInt32(-1);
    writer.writeUint32(255);
    expect(toArray(writer.toUint8Array())).toEqual([
      255, 255, 255, 255, 0, 0, 0, 255
    ]);
  });

  it('writes big-endian 64-bit integers', () => {
    const writer = new Writer();
    writer.writeBigInt64(-1n);
    writer.writeBigUint64(1n);
    expect(toArray(writer.toUint8Array())).toEqual([
      255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 1
    ]);
  });

  it('writes IEEE-754 floats', () => {
    const writer = new Writer();
    writer.writeFloat32(1);
    writer.writeFloat64(1);
    expect(toArray(writer.toUint8Array())).toEqual([
      63, 128, 0, 0, 63, 240, 0, 0, 0, 0, 0, 0
    ]);
  });

  it('appends raw byte chunks in order', () => {
    const writer = new Writer();
    writer.writeBytes(bytes([1, 2, 3]));
    writer.writeBytes(bytes([4]));
    expect(toArray(writer.toUint8Array())).toEqual([1, 2, 3, 4]);
  });

  it('writes byte chunks larger than the initial buffer', () => {
    const writer = new Writer();
    const payload = new Uint8Array(200000);
    payload[0] = 1;
    payload[payload.length - 1] = 255;

    writer.writeBytes(payload);

    const output = writer.toUint8Array();
    expect(output).toHaveLength(payload.length);
    expect(output[0]).toBe(1);
    expect(output[output.length - 1]).toBe(255);
  });

  it('keeps writing scalars correctly across buffer growth', () => {
    // The initial buffer holds 8192 bytes, so this crosses several growth
    // steps. Scalar writes go through a cached DataView, and that view has to
    // be replaced when the buffer is reallocated.
    const count = 5000;
    const writer = new Writer();
    for (let i = 0; i < count; i++) {
      writer.writeUint32(i);
    }

    const output = writer.toUint8Array();
    expect(output).toHaveLength(count * 4);

    const view = new DataView(
      output.buffer,
      output.byteOffset,
      output.byteLength
    );
    for (let i = 0; i < count; i++) {
      expect(view.getUint32(i * 4, false)).toBe(i);
    }
  });

  it('keeps writing scalars correctly when growth is triggered mid-value', () => {
    // Fill to one byte short of the boundary so the next 8-byte scalar
    // straddles the reallocation.
    const writer = new Writer();
    writer.writeBytes(bytes(new Array(8188).fill(7)));
    writer.writeBigUint64(0xdead_beef_cafe_baben);

    const output = writer.toUint8Array();
    expect(output).toHaveLength(8188 + 8);
    const view = new DataView(
      output.buffer,
      output.byteOffset,
      output.byteLength
    );
    expect(view.getBigUint64(8188, false)).toBe(0xdead_beef_cafe_baben);
  });

  it('does not advance after a scalar write fails', () => {
    const writer = new Writer();
    expect(() => writer.writeBigInt64(1 as unknown as bigint)).toThrow(
      XdrError
    );

    writer.writeUint32(7);
    expect(toArray(writer.toUint8Array())).toEqual([0, 0, 0, 7]);
  });

  describe('input validation', () => {
    // Each case must throw XdrError and leave the writer untouched, so a
    // following valid write lands at offset 0.
    function expectRejected(write: (writer: Writer) => void): void {
      const writer = new Writer();
      expect(() => write(writer)).toThrow(XdrError);
      expect(writer.offset).toBe(0);
      writer.writeUint32(7);
      expect(toArray(writer.toUint8Array())).toEqual([0, 0, 0, 7]);
    }

    it('rejects out-of-range and non-integer 32-bit values', () => {
      for (const value of [2 ** 31, -(2 ** 31) - 1, 1000.75, NaN, Infinity]) {
        expectRejected((w) => w.writeInt32(value));
      }
      for (const value of [2 ** 32, -1, 0.5, NaN, Infinity]) {
        expectRejected((w) => w.writeUint32(value));
      }
      expectRejected((w) => w.writeUint32('1' as unknown as number));
    });

    it('accepts 32-bit range edges', () => {
      const writer = new Writer();
      writer.writeInt32(-(2 ** 31));
      writer.writeInt32(2 ** 31 - 1);
      writer.writeUint32(0);
      writer.writeUint32(2 ** 32 - 1);
      expect(toArray(writer.toUint8Array())).toEqual([
        128, 0, 0, 0, 127, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255
      ]);
    });

    it('rejects out-of-range 64-bit values', () => {
      expectRejected((w) => w.writeBigInt64(1n << 63n));
      expectRejected((w) => w.writeBigInt64(-(1n << 63n) - 1n));
      expectRejected((w) => w.writeBigUint64(1n << 64n));
      expectRejected((w) => w.writeBigUint64(-1n));
      expectRejected((w) => w.writeBigUint64(1 as unknown as bigint));
    });

    it('accepts 64-bit range edges', () => {
      const writer = new Writer();
      writer.writeBigInt64(-(1n << 63n));
      writer.writeBigInt64((1n << 63n) - 1n);
      writer.writeBigUint64(0n);
      writer.writeBigUint64((1n << 64n) - 1n);
      expect(writer.offset).toBe(32);
    });

    it('rejects padding lengths that are not nonnegative integers', () => {
      for (const length of [1.5, -1, NaN, Infinity]) {
        expectRejected((w) => w.writePadding(length));
      }
    });

    it('rejects byte inputs that are not Uint8Arrays', () => {
      const forged = [
        { length: -4 },
        { length: 4, [Symbol.toStringTag]: 'Uint8Array' },
        Object.create(Uint8Array.prototype),
        new DataView(new ArrayBuffer(4)),
        new Uint16Array(2),
        new Int8Array(4),
        new Uint8ClampedArray(4),
        [1, 2, 3, 4]
      ];
      for (const value of forged) {
        expectRejected((w) => w.writeBytes(value as unknown as Uint8Array));
      }
    });

    it('does not let a forged length rewind the cursor', () => {
      const writer = new Writer();
      writer.writeUint32(0xaaaaaaaa);
      writer.writeUint32(0xbbbbbbbb);
      expect(() =>
        writer.writeBytes({ length: -4 } as unknown as Uint8Array)
      ).toThrow(XdrError);
      writer.writeUint32(0xcccccccc);
      expect(toArray(writer.toUint8Array())).toEqual([
        0xaa, 0xaa, 0xaa, 0xaa, 0xbb, 0xbb, 0xbb, 0xbb, 0xcc, 0xcc, 0xcc, 0xcc
      ]);
    });

    it('accepts Buffer and Uint8Arrays from another realm', () => {
      const foreign = runInNewContext('new Uint8Array([1, 2, 3])');
      expect(foreign instanceof Uint8Array).toBe(false);

      const writer = new Writer();
      writer.writeBytes(foreign);
      writer.writeBytes(Buffer.from([4, 5]));
      expect(toArray(writer.toUint8Array())).toEqual([1, 2, 3, 4, 5]);
    });
  });

  it('pads to the next 4-byte boundary based on length', () => {
    const cases: Array<[number, number[]]> = [
      [0, []],
      [1, [0, 0, 0]],
      [2, [0, 0]],
      [3, [0]],
      [4, []],
      [5, [0, 0, 0]]
    ];
    for (const [length, expected] of cases) {
      const writer = new Writer();
      writer.writePadding(length);
      expect(toArray(writer.toUint8Array())).toEqual(expected);
    }
  });
});
