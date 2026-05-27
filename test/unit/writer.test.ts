import { describe, it, expect } from 'vitest';
import { Writer } from '../../src/index.js';
import { bytes, toArray } from './_helpers.js';

describe('Writer', () => {
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
