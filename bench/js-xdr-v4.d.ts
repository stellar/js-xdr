// The v4 package ships no type declarations. This hand-written surface covers
// only what the comparison bench touches; it is not a faithful v4 typing.
declare module 'js-xdr-v4' {
  export interface V4Builder {
    enum(name: string, members: Record<string, number>): void;
    struct(name: string, fields: [string, unknown][]): void;
    union(name: string, spec: object): void;
    lookup(name: string): unknown;
    opaque(length: number): unknown;
    string(maxLength: number): unknown;
    void(): unknown;
    uint(): unknown;
    hyper(): unknown;
    uhyper(): unknown;
    array(childType: unknown, length: number): unknown;
    varArray(childType: unknown, maxLength: number): unknown;
  }

  export interface V4Value {
    toXDR(): Buffer;
  }

  export interface V4Type {
    fromXDR(input: Buffer): V4Value;
  }

  export function config(
    define: (xdr: V4Builder) => void
  ): Record<string, V4Type>;
}
