import { bench, type BenchOptions } from 'vitest';

// Keep each benchmark short so the whole suite stays fast; raise `time`
// locally when chasing small regressions.
const BENCH_OPTS: BenchOptions = { time: 250 };

// Register every benchmark through this wrapper so no case silently falls
// back to vitest's default 500 ms run time and skews the table.
export function b(name: string, fn: () => void): void {
  bench(name, fn, BENCH_OPTS);
}

export function fill(length: number, seed = 7): Uint8Array {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    out[i] = (i * seed + 3) & 0xff;
  }
  return out;
}
