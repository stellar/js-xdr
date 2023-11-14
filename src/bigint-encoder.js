import JSBI from 'jsbi';

/**
 * Encode a native `bigint` value from a list of arbitrary integer-like values.
 *
 * @param {Array<number|bigint|string|JSBI.BigInt>} parts   slices to encode in
 *    big-endian format (i.e. earlier elements are higher bits)
 * @param {64|128|256} size   number of bits in the target integer type
 * @param {boolean} unsigned  whether it's an unsigned integer
 *
 * @returns {JSBI.BigInt}
 */
export function encodeBigIntFromBits(parts, size, unsigned) {
  /** @type {Array<JSBI.BigInt>} */
  if (!(parts instanceof Array)) {
    // allow a single parameter instead of an array
    parts = [parts];
  } else if (parts.length && parts[0] instanceof Array) {
    // unpack nested array param
    parts = parts[0];
  }

  const total = parts.length;
  const sliceSize = size / total;
  switch (sliceSize) {
    case 32:
    case 64:
    case 128:
    case 256:
      break;

    default:
      throw new RangeError(
        `expected slices to fit in 32/64/128/256 bits, got ${sliceSize}: ${parts}`
      );
  }

  // normalize all inputs to bigint
  try {
    for (let i = 0; i < parts.length; i++) {
      if (typeof parts[i] !== 'bigint') {
        parts[i] = JSBI.BigInt(parts[i].valueOf());
      }
    }
  } catch (e) {
    throw new TypeError(`expected bigint-like values, got: ${parts} (${e})`);
  }

  // check for sign mismatches for single inputs (this is a special case to
  // handle one parameter passed to e.g. UnsignedHyper et al.)
  // see https://github.com/stellar/js-xdr/pull/100#discussion_r1228770845
  if (unsigned && parts.length === 1 && JSBI.LT(parts[0], JSBI.BigInt(0))) {
    throw new RangeError(`expected a positive value, got: ${parts}`);
  }

  // encode in big-endian fashion, shifting each slice by the slice size
  let result = JSBI.asUintN(sliceSize, parts[0]); // safe: len >= 1
  for (let i = 1; i < parts.length; i++) {
    // result |= parts[i] << (i * sliceSize)
    result = JSBI.bitwiseOr(
      result,
      JSBI.leftShift(
        JSBI.asUintN(sliceSize, parts[i]),
        JSBI.BigInt(i * sliceSize)
      )
    );
  }

  // interpret value as signed if necessary and clamp it
  if (!unsigned) {
    result = JSBI.asIntN(size, result);
  }

  // check boundaries
  const [min, max] = calculateBigIntBoundaries(size, unsigned);
  if (result >= min && result <= max) {
    return result;
  }

  // failed to encode
  throw new TypeError(
    `bigint values [${parts}] for ${formatIntName(
      size,
      unsigned
    )} out of range [${min}, ${max}]: ${result}`
  );
}

/**
 * Transforms a single bigint value that's supposed to represent a `size`-bit
 * integer into a list of `sliceSize`d chunks.
 *
 * @param {bigint} value - Single bigint value to decompose
 * @param {64|128|256} iSize - Number of bits represented by `value`
 * @param {32|64|128} sliceSize - Number of chunks to decompose into
 * @return {bigint[]}
 */
export function sliceBigInt(value, iSize, sliceSize) {
  if (!(value instanceof JSBI)) {
    throw new TypeError(`Expected bigint 'value', got ${typeof value}`);
  }

  const total = iSize / sliceSize;
  if (total === 1) {
    return [value];
  }

  if (
    sliceSize < 32 ||
    sliceSize > 128 ||
    (total !== 2 && total !== 4 && total !== 8)
  ) {
    throw new TypeError(
      `invalid bigint (${value}) and slice size (${iSize} -> ${sliceSize}) combination`
    );
  }

  const shift = JSBI.BigInt(sliceSize);

  // iterate shift and mask application
  const result = new Array(total);
  for (let i = 0; i < total; i++) {
    // we force a signed interpretation to preserve sign in each slice value,
    // but downstream can convert to unsigned if it's appropriate
    result[i] = JSBI.asIntN(sliceSize, value); // clamps to size

    // move on to the next chunk
    value = JSBI.signedRightShift(value, shift);
  }

  return result;
}

export function formatIntName(precision, unsigned) {
  return `${unsigned ? 'u' : 'i'}${precision}`;
}

/**
 * Get min|max boundaries for an integer with a specified bits size
 * @param {64|128|256} size   number of bits in the source integer type
 * @param {Boolean} unsigned  whether it's an unsigned integer
 * @return {JSBI.BigInt[]}
 */
export function calculateBigIntBoundaries(size, unsigned) {
  if (unsigned) {
    return [
      JSBI.BigInt(0),
      JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(size)).subtract(JSBI.BigInt(1))
    ];
  }

  const boundary = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(size - 1));
  return [
    JSBI.subtract(JSBI.BigInt(0), boundary),
    JSBI.subtract(boundary, JSBI.BigInt(1))
  ];
}
