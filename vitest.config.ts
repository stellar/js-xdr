import { defineConfig } from 'vitest/config';
import { BenchmarkReporter } from 'vitest/reporters';

// The stock bench reporter ends every run with a "BENCH Summary" block of
// pairwise "Nx faster than" lines, comparing unrelated cases that merely share
// a describe group. There is no config switch for it, so silence the hook.
class NoSummaryBenchmarkReporter extends BenchmarkReporter {
  override reportBenchmarkSummary(): void {}
}

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    benchmark: {
      include: ['bench/**/*.bench.ts'],
      reporters: [new NoSummaryBenchmarkReporter()]
    }
  }
});
