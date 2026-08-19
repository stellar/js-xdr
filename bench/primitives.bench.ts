import { bench, describe } from 'vitest';
import {
  bool,
  double,
  float,
  int32,
  int64,
  uint32,
  uint64
} from '../src/index.js';
import { BENCH_OPTS } from './_fixtures.js';

const Bool = bool();
const Int32 = int32();
const Uint32 = uint32();
const Int64 = int64();
const Uint64 = uint64();
const Float = float();
const Double = double();

const BOOL_BYTES = Bool.encode(true);
const INT32_BYTES = Int32.encode(-123_456);
const UINT32_BYTES = Uint32.encode(123_456);
const INT64_BYTES = Int64.encode(-1_234_567_890_123n);
const UINT64_BYTES = Uint64.encode(1_234_567_890_123n);
const FLOAT_BYTES = Float.encode(1.5);
const DOUBLE_BYTES = Double.encode(1.234567890123);

describe('bool', () => {
  bench('encode', () => void Bool.encode(true), BENCH_OPTS);
  bench('decode', () => void Bool.decode(BOOL_BYTES), BENCH_OPTS);
});

describe('int32', () => {
  bench('encode', () => void Int32.encode(-123_456), BENCH_OPTS);
  bench('decode', () => void Int32.decode(INT32_BYTES), BENCH_OPTS);
});

describe('uint32', () => {
  bench('encode', () => void Uint32.encode(123_456), BENCH_OPTS);
  bench('decode', () => void Uint32.decode(UINT32_BYTES), BENCH_OPTS);
});

describe('int64', () => {
  bench('encode', () => void Int64.encode(-1_234_567_890_123n), BENCH_OPTS);
  bench('decode', () => void Int64.decode(INT64_BYTES), BENCH_OPTS);
});

describe('uint64', () => {
  bench('encode', () => void Uint64.encode(1_234_567_890_123n), BENCH_OPTS);
  bench('decode', () => void Uint64.decode(UINT64_BYTES), BENCH_OPTS);
});

describe('float', () => {
  bench('encode', () => void Float.encode(1.5), BENCH_OPTS);
  bench('decode', () => void Float.decode(FLOAT_BYTES), BENCH_OPTS);
});

describe('double', () => {
  bench('encode', () => void Double.encode(1.234567890123), BENCH_OPTS);
  bench('decode', () => void Double.decode(DOUBLE_BYTES), BENCH_OPTS);
});
