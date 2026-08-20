import { describe } from 'vitest';
import { array, enumType, fixedArray, int32, option } from '../src/index.js';
import { b } from './_bench.js';
import {
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

const MEMO_VOID_VALUE = { type: 0 as const };
const MEMO_VOID_BYTES = Memo.encode(MEMO_VOID_VALUE);
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
  b('encode', () => void Color.encode(Color.green));
  b('decode', () => void Color.decode(COLOR_BYTES));
});

describe('struct', () => {
  b('encode flat (3 fields)', () => void Range.encode(RANGE_VALUE));
  b('decode flat (3 fields)', () => void Range.decode(RANGE_BYTES));
  b('encode nested', () => void Line.encode(LINE_VALUE));
  b('decode nested', () => void Line.decode(LINE_BYTES));
});

describe('union', () => {
  b('encode void arm', () => void Memo.encode(MEMO_VOID_VALUE));
  b('decode void arm', () => void Memo.decode(MEMO_VOID_BYTES));
  b('encode payload arm', () => void Memo.encode(MEMO_ID_VALUE));
  b('decode payload arm', () => void Memo.decode(MEMO_ID_BYTES));
});

describe('option', () => {
  b('encode present', () => void OptInt.encode(7));
  b('decode present', () => void OptInt.decode(OPT_PRESENT_BYTES));
  b('encode absent', () => void OptInt.encode(null));
  b('decode absent', () => void OptInt.decode(OPT_ABSENT_BYTES));
});

describe('array of int32', () => {
  b('encode 10 elements', () => void IntArray.encode(INTS_10));
  b('decode 10 elements', () => void IntArray.decode(INT_ARRAY_10_BYTES));
  b('encode 1000 elements', () => void IntArray.encode(INTS_1000));
  b('decode 1000 elements', () => void IntArray.decode(INT_ARRAY_1000_BYTES));
  b('encode 1000 elements (fixed)', () => void IntFixedArray.encode(INTS_1000));
  b(
    'decode 1000 elements (fixed)',
    () => void IntFixedArray.decode(INT_FIXED_1000_BYTES)
  );
});

describe('array of structs', () => {
  b('encode 100 payments', () => void PaymentArray.encode(PAYMENTS_100));
  b('decode 100 payments', () => void PaymentArray.decode(PAYMENT_ARRAY_BYTES));
});
