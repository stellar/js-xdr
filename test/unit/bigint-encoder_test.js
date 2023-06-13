import { encodeBigIntFromBits, formatIntName, sliceBigInt } from '../../src/bigint-encoder';

describe('encodeBigIntWithPrecision', function () {
  it(`encodes values correctly`, () => {
    const testCases = [
      // i64
      [[0], 64, false, 0n],
      [[-1], 64, false, -1n],
      [['-15258'], 64, false, -15258n],
      [[-0x8000000000000000n], 64, false, -0x8000000000000000n],
      [[0x7FFFFFFFFFFFFFFFn], 64, false, 0x7FFFFFFFFFFFFFFFn],
      [[1, -0x80000000n], 64, false, -0x7FFFFFFFFFFFFFFFn],
      [[-1, -1], 64, false, -1n],
      [[-2, 0x7fffffffn], 64, false, 0X7FFFFFFFFFFFFFFEn],
      [[345, -345], 64, false, -0x158fffffea7n],
      // u64
      [[0], 64, true, 0n],
      [[1n], 64, true, 1n],
      [[0xFFFFFFFFFFFFFFFFn], 64, true, 0xFFFFFFFFFFFFFFFFn],
      [[0n, 0n], 64, true, 0n],
      [[1, 0], 64, true, 1n],
      [[-1, -1], 64, true, 0xFFFFFFFFFFFFFFFFn],
      [[-2, -1], 64, true, 0xFFFFFFFFFFFFFFFEn],
      // i128
      [[0], 128, false, 0n],
      [[-1], 128, false, -1n],
      [['-15258'], 128, false, -15258n],
      [[-0x80000000000000000000000000000000n], 128, false, -0x80000000000000000000000000000000n],
      [[0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 128, false, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[1, -2147483648], 128, false, -0x7FFFFFFFFFFFFFFFFFFFFFFFn],
      [[-1, -1], 128, false, -1n],
      [[-1, 0x7FFFFFFFFFFFFFFFn], 128, false, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[0xFFFFFFFFFFFFFFFFn, 0x7FFFFFFFFFFFFFFFn], 128, false, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[0, -0x8000000000000000n], 128, false, -0x80000000000000000000000000000000n],
      [[1, -0x8000000000000000n], 128, false, -0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[1, 0, 0, -0x80000000n], 128, false, -0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[345, 345n, '345', 0x159], 128, false, 0x159000001590000015900000159n],
      // u128
      [[0], 128, true, 0n],
      [[1n], 128, true, 1n],
      [[0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 128, true, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[0n, 0n], 128, true, 0n],
      [[1, 0], 128, true, 1n],
      [[-1, -1], 128, true, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[-2, -1], 128, true, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEn],
      [[0x5CFFFFFFFFFFFFFFn, 0x7FFFFFFFFFFFFFFFn], 128, true, 0x7FFFFFFFFFFFFFFF5CFFFFFFFFFFFFFFn],
      [[1, 1, -1, -0x80000000n], 128, true, 0x80000000FFFFFFFF0000000100000001n],
      [[345, 345n, '345', 0x159], 128, false, 0x159000001590000015900000159n],
      // i256
      [[0], 256, false, 0n],
      [[-1], 256, false, -1n],
      [['-15258'], 256, false, -15258n],
      [[-0x8000000000000000000000000000000000000000000000000000000000000000n], 256, false, -0x8000000000000000000000000000000000000000000000000000000000000000n],
      [[0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 256, false, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[1, -2147483648], 256, false, -0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[-1, -1], 256, false, -1n],
      [[-1, 0x7FFFFFFFFFFFFFFFn], 256, false, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 256, false, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[0, -0x80000000000000000000000000000000n], 256, false, -0x8000000000000000000000000000000000000000000000000000000000000000n],
      [[1, -0x80000000000000000000000000000000n], 256, false, -0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[1, 0, 0, -0x800000000000000n], 256, false, -0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[345, 345n, '345', -0x159], 256, false, -0x158FFFFFFFFFFFFFEA6FFFFFFFFFFFFFEA6FFFFFFFFFFFFFEA7n],
      [[1, 2, 3, 4, 5, 6, 7, -8], 256, false, -0x7FFFFFFF8FFFFFFF9FFFFFFFAFFFFFFFBFFFFFFFCFFFFFFFDFFFFFFFFn],
      [[1, -2, 3, -4, 5, -6, 7, -8], 256, false, -0x7FFFFFFF800000005FFFFFFFA00000003FFFFFFFC00000001FFFFFFFFn],
      // u256
      [[0], 256, true, 0n],
      [[1n], 256, true, 1n],
      [[0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 256, true, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[0n, 0n], 256, true, 0n],
      [[1, 0], 256, true, 1n],
      [[-1, -1], 256, true, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[-2, -1], 256, true, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEn],
      [[0x5CFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 256, true, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5CFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn],
      [[1, 1, -1, -0x80000000n], 256, true, 0xFFFFFFFF80000000FFFFFFFFFFFFFFFF00000000000000010000000000000001n],
      [[1558245471070191615n, 1558245471070191615n, '1558245471070191615', 0x159FFFFFFFFFFFFFn], 256, false, 0x159fffffffffffff159fffffffffffff159fffffffffffff159fffffffffffffn],
      [[1, 2, 3, 4, 5, 6, 7, 8], 256, false, 0x0000000800000007000000060000000500000004000000030000000200000001n],
    ];

    for (let [args, bits, unsigned, expected] of testCases) {
      try {
        const actual = encodeBigIntFromBits(args, bits, unsigned);
        expect(actual).to.eq(expected, `bigint values for ${formatIntName(bits, unsigned)} out of range: [${args.join()}]`);
      } catch (e) {
        e.message = `Encoding [${args.join()}] => ${formatIntName(bits, unsigned)} BigInt failed with error: ${e.message}`;
        throw e;
      }
    }
  })
})

describe('sliceBigInt', function () {
  it(`slices values correctly`, () => {
    const testCases = [
      [0n, 64, 64, [0n]],
      [0n, 256, 256, [0n]],
      [-1n, 64, 32, [-1n, -1n]],
      [0xFFFFFFFFFFFFFFFEn, 64, 32, [-2n, -1n]],
      [0x7FFFFFFFFFFFFFFF5CFFFFFFFFFFFFFFn, 128, 64, [0x5CFFFFFFFFFFFFFFn, 0x7FFFFFFFFFFFFFFFn]],
      [0x80000000FFFFFFFF0000000100000001n, 128, 32, [1n, 1n, -1n, -0x80000000n]],
      [-0x158FFFFFFFFFFFFFEA6FFFFFFFFFFFFFEA6FFFFFFFFFFFFFEA7n, 256, 64, [345n, 345n, 345n, -345n]],
      [0x0000000800000007000000060000000500000004000000030000000200000001n, 256, 32, [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n]],
      [-0x7FFFFFFF8FFFFFFF9FFFFFFFAFFFFFFFBFFFFFFFCFFFFFFFDFFFFFFFFn, 256, 32, [1n, 2n, 3n, 4n, 5n, 6n, 7n, -8n]],
      [-0x7FFFFFFF800000005FFFFFFFA00000003FFFFFFFC00000001FFFFFFFFn, 256, 32, [1n, -2n, 3n, -4n, 5n, -6n, 7n, -8n]],
    ];
    for (let [value, size, sliceSize, expected] of testCases) {
      try {
        const actual = sliceBigInt(value, size, sliceSize);
        expect(actual).to.eql(expected, `Invalid ${formatIntName(size, false)} / ${sliceSize} slicing result for ${value}`);
      } catch (e) {
        e.message = `Slicing ${value} for ${formatIntName(size, false)} / ${sliceSize} failed with error: ${e.message}`;
        throw e;
      }
    }
  })
})