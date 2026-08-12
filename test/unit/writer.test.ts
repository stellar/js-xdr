import { describe, it, expect } from 'vitest';
import { Writer } from '../../src/index.js';
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
      TypeError
    );

    writer.writeUint32(7);
    expect(toArray(writer.toUint8Array())).toEqual([0, 0, 0, 7]);
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
