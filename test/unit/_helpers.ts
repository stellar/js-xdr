import type { XdrType } from '../../src/index.js';

export function bytes(values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

export function toArray(value: Uint8Array): number[] {
  return Array.from(value);
}

export function roundTrip<T>(schema: XdrType<T>, value: T): T {
  return schema.decode(schema.encode(value));
}

// Calls encode with intentionally mistyped input, for negative tests that
// exercise the runtime guards without fighting the compiler.
export function encodeInvalid<T>(
  schema: XdrType<T>,
  value: unknown
): Uint8Array {
  return schema.encode(value as T);
}
