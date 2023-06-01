/**
 * Encode BigInt value from arbitrary provided arguments
 *
 * @param {Array<Number|BigInt|String>} parts - Slices to encode, where the
 *    earlier elements represent higher bits in the final integer
 * @param {64|128|256} size - Number of bits in the target integer type
 * @param {Boolean} unsigned - Whether it's an unsigned integer
 *
 * @returns {BigInt}
 */
export function encodeBigIntFromBits(parts, size, unsigned) {
  let result = 0n;
  // check arguments length
  if (parts.length && parts[0] instanceof Array) {
    parts = parts[0];
  }
  const total = parts.length;
  if (total === 1) {
    try {
      result = BigInt(parts[0]);
      if (!unsigned) {
        result = BigInt.asIntN(size, result);
      }
    } catch (e) {
      throw new TypeError(`Invalid integer value: ${parts[0]}`)
    }
  } else {
    const sliceSize = size / total;
    if (sliceSize !== 32 && sliceSize !== 64 && sliceSize !== 128)
      throw new TypeError('Invalid number of arguments')
    // combine parts
    for (let i = 0; i < total; i++) {
      let part = BigInt.asUintN(sliceSize, BigInt(parts[i].valueOf()));
      part <<= BigInt(i * sliceSize);
      result |= part;
    }
    if (!unsigned) { // clamp value to the requested size
      result = BigInt.asIntN(size, result);
    }
  }
  // check type
  if (typeof result === 'bigint') {
    // check boundaries
    const [min, max] = calculateBigIntBoundaries(size, unsigned);
    if (result >= min && result <= max)
      return result;
  }
  // failed to encode
  throw new TypeError(`Invalid ${formatIntName(size, unsigned)} value`);
}

/**
 * @param {BigInt} value - Slices to encode
 * @param {64|128|256} size - Number of bits in the source integer type
 * @param {32|64|128} sliceSize - Number of parts
 * @return {BigInt[]}
 */
export function sliceBigInt(value, size, sliceSize) {
  if (typeof value !== 'bigint')
    throw new TypeError('Invalid BigInt value');
  const total = size / sliceSize;
  if (total === 1)
    return [value];
  if (sliceSize < 32 || sliceSize > 128 || total !== 2 && total !== 4 && total !== 8)
    throw new TypeError('Invalid slice size');
  // prepare shift and mask
  const shift = BigInt(sliceSize);
  const mask = (1n << shift) - 1n;
  // iterate shift and mask application
  const result = new Array(total);
  for (let i = 0; i < total; i++) {
    if (i > 0) {
      value >>= shift;
    }
    result[i] = BigInt.asIntN(sliceSize, value & mask); // clamp value
  }
  return result;
}

export function formatIntName(precision, unsigned) {
  return `${unsigned ? 'u' : 'i'}${precision}`;
}

/**
 * Get min|max boundaries for an integer with a specified bits size
 * @param {64|128|256} size - Number of bits in the source integer type
 * @param {Boolean} unsigned - Whether it's an unsigned integer
 * @return {BigInt[]}
 */
export function calculateBigIntBoundaries(size, unsigned) {
  if (unsigned)
    return [0n, (1n << BigInt(size)) - 1n];
  const boundary = 1n << BigInt(size - 1);
  return [0n - boundary, boundary - 1n];
}