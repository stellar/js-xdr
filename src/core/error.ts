const BRAND = 'XdrError';

/**
 * Error thrown for schema definition problems and XDR encode/decode failures.
 *
 * Catch this when you need to distinguish malformed XDR or invalid values from
 * unrelated application errors.
 */
export class XdrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BRAND;
  }

  /**
   * Brand-based `instanceof` so the check keeps working when the ESM and CJS
   * builds of this package coexist in one dependency graph (each build has its
   * own class identity, so a reference-equality `instanceof` would fail).
   */
  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && value.name === BRAND;
  }
}
