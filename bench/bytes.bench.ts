import { describe } from 'vitest';
import { opaque, string, varOpaque } from '../src/index.js';
import { b, fill } from './_bench.js';

// 60 000 B stays below Writer's 65 536 B power-of-two growth boundary even
// with a 4-byte length prefix, so opaque and varOpaque encodes pay the same
// number of buffer doublings and their numbers stay comparable.
const SMALL = fill(32);
const LARGE = fill(60_000);
// Unaligned lengths force the padding read/write branch, which 4-byte-aligned
// payloads never touch.
const SMALL_UNALIGNED = fill(33);
const LARGE_UNALIGNED = fill(59_997);

const Opaque32 = opaque(32);
const Opaque60k = opaque(60_000);
const VarOpaque60k = varOpaque(60_000);
const String60k = string(60_000);

const OPAQUE32_BYTES = Opaque32.encode(SMALL);
const OPAQUE60K_BYTES = Opaque60k.encode(LARGE);
const VAR_SMALL_BYTES = VarOpaque60k.encode(SMALL);
const VAR_LARGE_BYTES = VarOpaque60k.encode(LARGE);
const STRING_SMALL_BYTES = String60k.encode(SMALL_UNALIGNED);
const STRING_LARGE_BYTES = String60k.encode(LARGE_UNALIGNED);

describe('opaque', () => {
  b('encode 32 B', () => void Opaque32.encode(SMALL));
  b('decode 32 B', () => void Opaque32.decode(OPAQUE32_BYTES));
  b('encode 60 kB', () => void Opaque60k.encode(LARGE));
  b('decode 60 kB', () => void Opaque60k.decode(OPAQUE60K_BYTES));
});

describe('varOpaque', () => {
  b('encode 32 B', () => void VarOpaque60k.encode(SMALL));
  b('decode 32 B', () => void VarOpaque60k.decode(VAR_SMALL_BYTES));
  b('encode 60 kB', () => void VarOpaque60k.encode(LARGE));
  b('decode 60 kB', () => void VarOpaque60k.decode(VAR_LARGE_BYTES));
});

// string shares varOpaque's aligned code path line for line, so these benches
// use unaligned payloads to cover the padding branch instead of duplicating
// the varOpaque numbers.
describe('string', () => {
  b('encode 33 B (unaligned)', () => void String60k.encode(SMALL_UNALIGNED));
  b('decode 33 B (unaligned)', () => void String60k.decode(STRING_SMALL_BYTES));
  b('encode 60 kB (unaligned)', () => void String60k.encode(LARGE_UNALIGNED));
  b(
    'decode 60 kB (unaligned)',
    () => void String60k.decode(STRING_LARGE_BYTES)
  );
});
