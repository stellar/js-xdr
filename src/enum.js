import { Int } from './int';
import { XdrPrimitiveType } from './xdr-type';
import { XdrReaderError, XdrWriterError } from './errors';

export class Enum extends XdrPrimitiveType {
  constructor(name, value) {
    super();
    this.name = name;
    this.value = value;
  }

  /**
   * @inheritDoc
   */
  static read(reader) {
    const intVal = Int.read(reader);
    const res = this._byValue[intVal];
    if (res === undefined)
      throw new XdrReaderError(
        `unknown ${this.enumName} member for value ${intVal}`
      );
    return res;
  }

  /**
   * @inheritDoc
   */
  static write(value, writer) {
    if (!(value instanceof this))
      throw new XdrWriterError(`unknown ${value} is not a ${this.enumName}`);

    Int.write(value.value, writer);
  }

  /**
   * @inheritDoc
   */
  static isValid(value) {
    return value instanceof this;
  }

  static members() {
    return this._members;
  }

  static values() {
    return Object.values(this._members);
  }

  static fromName(name) {
    const result = this._members[name];

    if (!result)
      throw new TypeError(`${name} is not a member of ${this.enumName}`);

    return result;
  }

  static fromValue(value) {
    const result = this._byValue[value];
    if (result === undefined)
      throw new TypeError(
        `${value} is not a value of any member of ${this.enumName}`
      );
    return result;
  }

  static create(context, name, members) {
    const ChildEnum = class extends Enum {};

    ChildEnum.enumName = name;
    context.results[name] = ChildEnum;

    ChildEnum._members = {};
    ChildEnum._byValue = {};

    for (const [key, value] of Object.entries(members)) {
      const inst = new ChildEnum(key, value);
      ChildEnum._members[key] = inst;
      ChildEnum._byValue[value] = inst;
      ChildEnum[key] = () => inst;
    }

    return ChildEnum;
  }
}
