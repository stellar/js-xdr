import { XdrError } from '../core/error.js';
import { assertIntRange } from '../core/helpers.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type XdrType } from '../core/xdr-type.js';

export type EnumMember<Values extends Record<string, number>> =
  Values[keyof Values];

export type EnumName<Values extends Record<string, number>> = Extract<
  keyof Values,
  string
>;

export type EnumSchema<
  Name extends string,
  Values extends Record<string, number>
> = XdrType<EnumMember<Values>> & {
  readonly name: Name;
  readonly nameByValue: ReadonlyMap<number, EnumName<Values>>;
} & Values;

const RESERVED_ENUM_MEMBER_NAMES = new Set([
  'name',
  'kind',
  'encode',
  'decode',
  'validate',
  '_read',
  '_write',
  'nameByValue'
]);

/**
 * Reads and writes XDR enum values.
 *
 * Runtime values are numeric discriminants; member names are metadata exposed
 * on the public enum schema.
 */
export class EnumType<Values extends Record<string, number>> extends BaseType<
  EnumMember<Values>
> {
  readonly kind = 'enum';
  // Maps wire value → declared member name. Public so the generic toJson
  // walker can render numeric enums as their string names.
  readonly nameByValue: ReadonlyMap<number, EnumName<Values>>;
  readonly #valuesSet = new Set<number>();

  constructor(name: string, values: Values) {
    super(name);
    const nameByValue = new Map<number, EnumName<Values>>();
    for (const [memberName, memberValue] of Object.entries(values)) {
      assertIntRange(
        memberValue,
        -2147483648,
        2147483647,
        `${name}.${memberName}`
      );
      if (this.#valuesSet.has(memberValue)) {
        throw new XdrError(`${name}: duplicate enum value ${memberValue}`);
      }
      this.#valuesSet.add(memberValue);
      nameByValue.set(memberValue, memberName as EnumName<Values>);
    }
    this.nameByValue = nameByValue;
  }

  _read(reader: Reader, path: string): EnumMember<Values> {
    const value = reader.readInt32(path);
    if (!this.#valuesSet.has(value)) {
      throw new XdrError(`${path}: unknown enum value ${value}`);
    }
    return value as EnumMember<Values>;
  }

  _write(value: EnumMember<Values>, writer: Writer, path: string): void {
    if (typeof value !== 'number' || !this.#valuesSet.has(value)) {
      throw new XdrError(`${path}: unknown enum value ${String(value)}`);
    }
    writer.writeInt32(value);
  }
}

/**
 * Creates a schema for an XDR enum.
 *
 * Values are the numeric wire discriminants. The returned schema also exposes
 * each member name as a numeric property, so callers can use named constants
 * while storing numbers in encoded data. Duplicate wire values and member names
 * that collide with schema properties are rejected.
 *
 * @example
 * ```ts
 * const Color = enumType('Color', { red: 0, green: 1, blue: 2 });
 * Color.encode(Color.green);
 * Color.decode(bytes); // 1
 * ```
 */
export function enumType<
  Name extends string,
  Values extends Record<string, number>
>(name: Name, values: Values): EnumSchema<Name, Values> {
  for (const memberName of Object.keys(values)) {
    if (RESERVED_ENUM_MEMBER_NAMES.has(memberName)) {
      throw new XdrError(
        `${name}: enum member name ${memberName} collides with reserved property`
      );
    }
  }
  const schema = new EnumType(name, values);
  return Object.assign(schema, values) as unknown as EnumSchema<Name, Values>;
}
