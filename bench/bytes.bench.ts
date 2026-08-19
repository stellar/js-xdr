import { bench, describe } from 'vitest';
import { opaque, string, varOpaque } from '../src/index.js';
import { BENCH_OPTS, fill } from './_fixtures.js';

const SMALL = fill(32);
const LARGE = fill(65_536);

const Opaque32 = opaque(32);
const Opaque64k = opaque(65_536);
const VarOpaque64k = varOpaque(65_536);
const String64k = string(65_536);

const OPAQUE32_BYTES = Opaque32.encode(SMALL);
const OPAQUE64K_BYTES = Opaque64k.encode(LARGE);
const VAR_SMALL_BYTES = VarOpaque64k.encode(SMALL);
const VAR_LARGE_BYTES = VarOpaque64k.encode(LARGE);
const STRING_SMALL_BYTES = String64k.encode(SMALL);
const STRING_LARGE_BYTES = String64k.encode(LARGE);

describe('opaque', () => {
  bench('encode 32 B', () => void Opaque32.encode(SMALL), BENCH_OPTS);
  bench('decode 32 B', () => void Opaque32.decode(OPAQUE32_BYTES), BENCH_OPTS);
  bench('encode 64 KiB', () => void Opaque64k.encode(LARGE), BENCH_OPTS);
  bench(
    'decode 64 KiB',
    () => void Opaque64k.decode(OPAQUE64K_BYTES),
    BENCH_OPTS
  );
});

describe('varOpaque', () => {
  bench('encode 32 B', () => void VarOpaque64k.encode(SMALL), BENCH_OPTS);
  bench(
    'decode 32 B',
    () => void VarOpaque64k.decode(VAR_SMALL_BYTES),
    BENCH_OPTS
  );
  bench('encode 64 KiB', () => void VarOpaque64k.encode(LARGE), BENCH_OPTS);
  bench(
    'decode 64 KiB',
    () => void VarOpaque64k.decode(VAR_LARGE_BYTES),
    BENCH_OPTS
  );
});

describe('string', () => {
  bench('encode 32 B', () => void String64k.encode(SMALL), BENCH_OPTS);
  bench(
    'decode 32 B',
    () => void String64k.decode(STRING_SMALL_BYTES),
    BENCH_OPTS
  );
  bench('encode 64 KiB', () => void String64k.encode(LARGE), BENCH_OPTS);
  bench(
    'decode 64 KiB',
    () => void String64k.decode(STRING_LARGE_BYTES),
    BENCH_OPTS
  );
});
