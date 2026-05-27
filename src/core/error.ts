/**
 * Error thrown for schema definition problems and XDR encode/decode failures.
 *
 * Catch this when you need to distinguish malformed XDR or invalid values from
 * unrelated application errors.
 */
export class XdrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XdrError';
  }
}
