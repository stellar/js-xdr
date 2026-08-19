import { bench, describe } from 'vitest';
import { array, enumType, fixedArray, int32, option } from '../src/index.js';
import {
  BENCH_OPTS,
  Line,
  LINE_BYTES,
  LINE_VALUE,
  Memo,
  Range,
  RANGE_BYTES,
  RANGE_VALUE,
  makePayment,
  Payment
} from './_fixtures.js';

const Color = enumType('Color', { red: 0, green: 1, blue: 2 });
const COLOR_BYTES = Color.encode(Color.green);

const OptInt = option(int32());
const OPT_PRESENT_BYTES = OptInt.encode(7);
const OPT_ABSENT_BYTES = OptInt.encode(null);

const MEMO_VOID_BYTES = Memo.encode({ type: 0 });
const MEMO_ID_VALUE = { type: 2 as const, id: 987_654_321n };
const MEMO_ID_BYTES = Memo.encode(MEMO_ID_VALUE);

const IntArray = array(int32(), 10_000);
const IntFixedArray = fixedArray(int32(), 1000);
const INTS_10 = Array.from({ length: 10 }, (_, i) => i);
const INTS_1000 = Array.from({ length: 1000 }, (_, i) => i);
const INT_ARRAY_10_BYTES = IntArray.encode(INTS_10);
const INT_ARRAY_1000_BYTES = IntArray.encode(INTS_1000);
const INT_FIXED_1000_BYTES = IntFixedArray.encode(INTS_1000);

const PaymentArray = array(Payment, 1000);
const PAYMENTS_100 = Array.from({ length: 100 }, (_, i) => makePayment(i));
const PAYMENT_ARRAY_BYTES = PaymentArray.encode(PAYMENTS_100);

describe('enum', () => {
  bench('encode', () => void Color.encode(Color.green), BENCH_OPTS);
  bench('decode', () => void Color.decode(COLOR_BYTES), BENCH_OPTS);
});

describe('struct', () => {
  bench(
    'encode flat (3 fields)',
    () => void Range.encode(RANGE_VALUE),
    BENCH_OPTS
  );
  bench(
    'decode flat (3 fields)',
    () => void Range.decode(RANGE_BYTES),
    BENCH_OPTS
  );
  bench('encode nested', () => void Line.encode(LINE_VALUE), BENCH_OPTS);
  bench('decode nested', () => void Line.decode(LINE_BYTES), BENCH_OPTS);
});

describe('union', () => {
  bench('encode void arm', () => void Memo.encode({ type: 0 }), BENCH_OPTS);
  bench('decode void arm', () => void Memo.decode(MEMO_VOID_BYTES), BENCH_OPTS);
  bench(
    'encode payload arm',
    () => void Memo.encode(MEMO_ID_VALUE),
    BENCH_OPTS
  );
  bench(
    'decode payload arm',
    () => void Memo.decode(MEMO_ID_BYTES),
    BENCH_OPTS
  );
});

describe('option', () => {
  bench('encode present', () => void OptInt.encode(7), BENCH_OPTS);
  bench(
    'decode present',
    () => void OptInt.decode(OPT_PRESENT_BYTES),
    BENCH_OPTS
  );
  bench('encode absent', () => void OptInt.encode(null), BENCH_OPTS);
  bench(
    'decode absent',
    () => void OptInt.decode(OPT_ABSENT_BYTES),
    BENCH_OPTS
  );
});

describe('array of int32', () => {
  bench('encode 10 elements', () => void IntArray.encode(INTS_10), BENCH_OPTS);
  bench(
    'decode 10 elements',
    () => void IntArray.decode(INT_ARRAY_10_BYTES),
    BENCH_OPTS
  );
  bench(
    'encode 1000 elements',
    () => void IntArray.encode(INTS_1000),
    BENCH_OPTS
  );
  bench(
    'decode 1000 elements',
    () => void IntArray.decode(INT_ARRAY_1000_BYTES),
    BENCH_OPTS
  );
  bench(
    'encode 1000 elements (fixed)',
    () => void IntFixedArray.encode(INTS_1000),
    BENCH_OPTS
  );
  bench(
    'decode 1000 elements (fixed)',
    () => void IntFixedArray.decode(INT_FIXED_1000_BYTES),
    BENCH_OPTS
  );
});

describe('array of structs', () => {
  bench(
    'encode 100 payments',
    () => void PaymentArray.encode(PAYMENTS_100),
    BENCH_OPTS
  );
  bench(
    'decode 100 payments',
    () => void PaymentArray.decode(PAYMENT_ARRAY_BYTES),
    BENCH_OPTS
  );
});
