import { describe } from 'vitest';
import {
  bool,
  double,
  float,
  int32,
  int64,
  uint32,
  uint64
} from '../src/index.js';
import { b } from './_bench.js';

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
  b('encode', () => void Bool.encode(true));
  b('decode', () => void Bool.decode(BOOL_BYTES));
});

describe('int32', () => {
  b('encode', () => void Int32.encode(-123_456));
  b('decode', () => void Int32.decode(INT32_BYTES));
});

describe('uint32', () => {
  b('encode', () => void Uint32.encode(123_456));
  b('decode', () => void Uint32.decode(UINT32_BYTES));
});

describe('int64', () => {
  b('encode', () => void Int64.encode(-1_234_567_890_123n));
  b('decode', () => void Int64.decode(INT64_BYTES));
});

describe('uint64', () => {
  b('encode', () => void Uint64.encode(1_234_567_890_123n));
  b('decode', () => void Uint64.decode(UINT64_BYTES));
});

describe('float', () => {
  b('encode', () => void Float.encode(1.5));
  b('decode', () => void Float.decode(FLOAT_BYTES));
});

describe('double', () => {
  b('encode', () => void Double.encode(1.234567890123));
  b('decode', () => void Double.decode(DOUBLE_BYTES));
});
