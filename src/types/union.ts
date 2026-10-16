import { XdrError } from '../core/error.js';
import type { Reader } from '../core/reader.js';
import type { Writer } from '../core/writer.js';
import { BaseType, type Infer, type XdrType } from '../core/xdr-type.js';
import { isPlainObject } from '../core/helpers.js';
import { DEFAULT_MAX_DEPTH } from '../core/reader.js';
import type { LazySchema } from './lazy.js';

/**
 * Named payload field for a non-void union arm.
 *
 * If a union case uses `field('code', int32())`, values for that case carry the
 * payload as `{ type: discriminant, code: number }`.
 */
export type Field<Name extends string, T extends XdrType<unknown>> = {
  readonly kind: 'field';
  readonly name: Name;
  readonly schema: T;
};
type VoidArm = XdrType<void>;

/**
 * Payload schema for a union arm.
 *
 * Use `void()` for arms with no payload, or `field(name, schema)` for arms that
 * carry one named payload value.
 */
export type UnionArm = VoidArm | Field<string, XdrType<unknown>>;

/**
 * Mapping between one discriminator value and the arm selected by that value.
 */
export type UnionCase<Name extends string, Disc, Arm extends UnionArm> = {
  readonly name: Name;
  readonly discriminant: Disc;
  readonly arm: Arm;
};
type ArmValue<Arm> = Arm extends Field<infer Name, infer Schema>
  ? { readonly [K in Name]: Infer<Schema> }
  : {};
type CaseValue<SwitchKey extends string, C> = C extends UnionCase<
  string,
  infer Disc,
  infer Arm
>
  ? { readonly [K in SwitchKey]: Disc } & ArmValue<Arm>
  : never;
type DefaultValue<Switch, SwitchKey extends string, Arm> = Arm extends UnionArm
  ? { readonly [K in SwitchKey]: Infer<Switch> } & ArmValue<Arm>
  : never;
type UnionValue<
  Switch extends XdrType<unknown>,
  Cases extends readonly UnionCase<string, unknown, UnionArm>[],
  DefaultArm,
  SwitchKey extends string
> =
  | CaseValue<SwitchKey, Cases[number]>
  | DefaultValue<Switch, SwitchKey, DefaultArm>;

const DEFAULT_CASE_NAME = 'default';

// RFC 4506 §6.4: a union discriminant must be int, unsigned int, bool, or an
// enum (typedefs resolve to one of these schemas).
const DISCRIMINANT_KINDS: ReadonlySet<string> = new Set([
  'int32',
  'uint32',
  'bool',
  'enum'
]);

/**
 * Reads and writes XDR unions.
 *
 * Runtime values are plain tagged objects. There are no generated static arm
 * constructors or accessor methods.
 */
class UnionType<
  Switch extends XdrType<string | number | boolean>,
  Cases extends readonly UnionCase<string, Infer<Switch>, UnionArm>[],
  DefaultArm extends UnionArm | undefined,
  SwitchKey extends string
> extends BaseType<UnionValue<Switch, Cases, DefaultArm, SwitchKey>> {
  readonly kind = 'union';
  // Exposed publicly so the generic toJson/fromJson walker can introspect
  // union shape (discriminator schema, case list, default arm, switch field).
  readonly switchOn: Switch;
  readonly cases: Cases;
  readonly defaultArm: DefaultArm;
  readonly switchKey: SwitchKey;
  readonly #casesByDiscriminant = new Map<Infer<Switch>, Cases[number]>();
  // A lazy switch in a case-less union may be a forward reference, so its kind
  // is checked on first read or write instead of at construction.
  #switchOnChecked: boolean;

  constructor(
    name: string,
    switchOn: Switch,
    cases: Cases,
    defaultArm: DefaultArm,
    switchKey: SwitchKey
  ) {
    super(name);
    // Same rationale as struct: '__proto__' cannot be defined as an own property on
    // a plain object without invoking the inherited prototype setter, so it is
    // not a legal discriminator field name.
    if (switchKey === '__proto__') {
      throw new XdrError(`${name}: switchKey '__proto__' is not allowed`);
    }
    // Cases force a lazy switch to resolve in the validate loop below anyway, so
    // only a case-less union can still be waiting on a forward reference.
    this.#switchOnChecked = switchOn.kind !== 'lazy' || cases.length > 0;
    if (this.#switchOnChecked) {
      const problem = discriminantSchemaProblem(switchOn);
      if (problem !== undefined) {
        throw new XdrError(`${name}: ${problem}`);
      }
    }
    this.switchOn = switchOn;
    this.cases = cases;
    this.defaultArm = defaultArm;
    this.switchKey = switchKey;
    if (cases.length === 0 && defaultArm === undefined) {
      throw new XdrError(
        `${name}: union needs at least one case or a default arm`
      );
    }
    const names = new Set<string>();
    for (const unionCase of cases) {
      if (!switchOn.validate(unionCase.discriminant)) {
        throw new XdrError(
          `${name}.${unionCase.name}: case discriminator ${String(
            unionCase.discriminant
          )} is not a valid ${switchOn.name ?? switchOn.kind} value`
        );
      }
      if (names.has(unionCase.name)) {
        throw new XdrError(
          `${name}: duplicate union case name ${unionCase.name}`
        );
      }
      names.add(unionCase.name);
      if (this.#casesByDiscriminant.has(unionCase.discriminant)) {
        throw new XdrError(
          `${name}: duplicate union discriminator ${String(
            unionCase.discriminant
          )}`
        );
      }
      assertArmPayloadName(name, unionCase.name, unionCase.arm, switchKey);
      this.#casesByDiscriminant.set(unionCase.discriminant, unionCase);
    }
    if (defaultArm !== undefined) {
      assertArmPayloadName(name, DEFAULT_CASE_NAME, defaultArm, switchKey);
    }
  }

  _read(
    reader: Reader,
    path: string
  ): UnionValue<Switch, Cases, DefaultArm, SwitchKey> {
    reader.enter(path);
    try {
      this.#checkSwitchOn();
      const discriminant = this.switchOn._read(
        reader,
        `${path}.${this.switchKey}`
      ) as Infer<Switch>;
      const unionCase = this.#casesByDiscriminant.get(discriminant);
      const arm = unionCase?.arm ?? this.defaultArm;
      if (arm === undefined) {
        throw new XdrError(
          `${path}: no case for union discriminator ${String(discriminant)}`
        );
      }
      return readUnionArm(
        discriminant,
        arm,
        this.switchKey,
        reader,
        `${path}.${unionCase?.name ?? DEFAULT_CASE_NAME}`
      ) as UnionValue<Switch, Cases, DefaultArm, SwitchKey>;
    } finally {
      reader.exit();
    }
  }

  _write(
    value: UnionValue<Switch, Cases, DefaultArm, SwitchKey>,
    writer: Writer,
    path: string
  ): void {
    writer.enter(path);
    try {
      this.#checkSwitchOn();
      if (
        !isPlainObject(value) ||
        !Object.prototype.hasOwnProperty.call(value, this.switchKey)
      ) {
        throw new XdrError(
          `${path}: expected union object with ${this.switchKey} discriminator`
        );
      }
      const unionValue = value as Readonly<Record<string, unknown>>;
      const switchValue = unionValue[this.switchKey] as Infer<Switch>;
      const unionCase = this.#casesByDiscriminant.get(switchValue);
      const arm = unionCase?.arm ?? this.defaultArm;
      if (arm === undefined) {
        throw new XdrError(
          `${path}: no case for union discriminator ${String(switchValue)}`
        );
      }
      this.switchOn._write(switchValue, writer, `${path}.${this.switchKey}`);
      writeUnionArm(
        unionValue,
        arm,
        writer,
        `${path}.${unionCase?.name ?? DEFAULT_CASE_NAME}`
      );
    } finally {
      writer.exit();
    }
  }

  #checkSwitchOn(): void {
    if (!this.#switchOnChecked) {
      const problem = discriminantSchemaProblem(this.switchOn);
      if (problem !== undefined) {
        // A plain Error, not XdrError: this is a schema bug, and validate and
        // validateXdr would report an XdrError as invalid input.
        throw new Error(`${this.name ?? this.kind}: ${problem}`);
      }
      this.#switchOnChecked = true;
    }
  }
}

/**
 * Creates a named payload field for a non-void union arm.
 *
 * The field name becomes the payload property on the JavaScript value for that
 * arm. It must not match the union's discriminator property.
 */
export function field<Name extends string, T extends XdrType<unknown>>(
  name: Name,
  schema: T
): Field<Name, T> {
  return { kind: 'field', name, schema };
}

/**
 * Creates one discriminator-to-arm mapping for a union schema.
 *
 * The discriminator must be a value accepted by the `switchOn` schema. For enum
 * switches, pass the enum member value such as `ResultType.ok`.
 */
function case_<
  Name extends string,
  Disc extends string | number | boolean,
  Arm extends UnionArm
>(name: Name, discriminant: Disc, arm: Arm): UnionCase<Name, Disc, Arm> {
  return { name, discriminant, arm };
}

export { case_ as case };
// `import { case }` is a syntax error, so consumers of the `case` export must
// alias it; `unionCase` is the same helper under an importable name.
export { case_ as unionCase };

/**
 * Creates a schema for an XDR union.
 *
 * Values are plain tagged objects. The discriminator is stored under `type` by
 * default, or under `switchKey` when provided. Void arms contain only the
 * discriminator. Non-void arms also contain the payload property declared with
 * `field`.
 *
 * @example
 * ```ts
 * const ResultType = enumType('ResultType', { ok: 0, error: 1 });
 * const Result = union('Result', {
 *   switchOn: ResultType,
 *   cases: [
 *     case('ok', ResultType.ok, void()),
 *     case('error', ResultType.error, field('code', int32())),
 *   ],
 * });
 *
 * Result.encode({ type: ResultType.error, code: 7 });
 * Result.decode(bytes); // { type: 1, code: 7 }
 * ```
 */
export function union<
  Name extends string,
  Switch extends XdrType<string | number | boolean>,
  Cases extends readonly UnionCase<string, Infer<Switch>, UnionArm>[],
  DefaultArm extends UnionArm | undefined = undefined,
  SwitchKey extends string = 'type'
>(
  name: Name,
  options: {
    readonly switchOn: Switch;
    readonly cases: Cases;
    readonly defaultArm?: DefaultArm;
    readonly switchKey?: SwitchKey;
  }
): UnionSchema<UnionValue<Switch, Cases, DefaultArm, SwitchKey>> & {
  readonly name: Name;
} {
  const switchKey = (options.switchKey ?? 'type') as SwitchKey;
  return new UnionType(
    name,
    options.switchOn,
    options.cases,
    options.defaultArm,
    switchKey
  ) as unknown as UnionSchema<
    UnionValue<Switch, Cases, DefaultArm, SwitchKey>
  > & {
    readonly name: Name;
  };
}

/**
 * Public introspection surface of a union schema.
 *
 * Narrow any `XdrType<unknown>` with `schema.kind === 'union'` to walk its
 * discriminator and arms generically, for example in a schema-driven JSON
 * converter.
 */
export interface UnionSchema<T> extends XdrType<T> {
  readonly kind: 'union';
  /** Schema that encodes the discriminant value. */
  readonly switchOn: XdrType<unknown>;
  /** Declared discriminator-to-arm mappings. */
  readonly cases: ReadonlyArray<UnionCase<string, unknown, UnionArm>>;
  /** Arm used for discriminants with no matching case, if declared. */
  readonly defaultArm: UnionArm | undefined;
  /** Property holding the discriminant on JavaScript values. */
  readonly switchKey: string;
}

function readUnionArm(
  discriminant: unknown,
  arm: UnionArm,
  switchKey: string,
  reader: Reader,
  path: string
): Record<string, unknown> {
  // Built field-by-field rather than as a literal spread onto a `base` object:
  // the spread allocates a second object for every union read, and unions are
  // the most common node in a Stellar XDR tree.
  const result: Record<string, unknown> = {};
  result[switchKey] = discriminant;
  if (isFieldArm(arm)) {
    result[arm.name] = arm.schema._read(reader, `${path}.${arm.name}`);
    return result;
  }
  arm._read(reader, path);
  return result;
}

function writeUnionArm(
  value: Readonly<Record<string, unknown>>,
  arm: UnionArm,
  writer: Writer,
  path: string
): void {
  if (isFieldArm(arm)) {
    if (!Object.prototype.hasOwnProperty.call(value, arm.name)) {
      throw new XdrError(`${path}.${arm.name}: missing union arm payload`);
    }
    arm.schema._write(value[arm.name], writer, `${path}.${arm.name}`);
    return;
  }
  arm._write(undefined, writer, path);
}

// Returns why switchOn cannot be a discriminant, or undefined if it can. Lazy
// hops are capped like nesting depth, since a lazy may return a new lazy on
// every call.
function discriminantSchemaProblem(
  switchOn: XdrType<unknown>
): string | undefined {
  let schema = switchOn;
  for (let hops = 0; schema.kind === 'lazy'; hops++) {
    if (hops === DEFAULT_MAX_DEPTH) {
      return 'switchOn lazy schema never resolves';
    }
    schema = (schema as LazySchema<unknown>).getSchema();
  }
  if (!DISCRIMINANT_KINDS.has(schema.kind)) {
    return `switchOn must be int32, uint32, bool, or an enum, got ${
      schema.name ?? schema.kind
    }`;
  }
  return undefined;
}

function assertArmPayloadName(
  unionName: string,
  caseName: string,
  arm: UnionArm,
  switchKey: string
): void {
  if (isFieldArm(arm) && arm.name === switchKey) {
    throw new XdrError(
      `${unionName}.${caseName}: union arm payload field must not be named ${switchKey}`
    );
  }
  if (isFieldArm(arm) && arm.name === '__proto__') {
    throw new XdrError(
      `${unionName}.${caseName}: union arm payload field name '__proto__' is not allowed`
    );
  }
}

function isFieldArm(arm: UnionArm): arm is Field<string, XdrType<unknown>> {
  return 'schema' in arm;
}
