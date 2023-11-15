import { Reference } from './reference';
import { XdrPrimitiveType } from './xdr-type';
import { XdrWriterError } from './errors';

export class Struct extends XdrPrimitiveType {
  constructor(attributes) {
    super();
    this._attributes = attributes || {};
  }

  /**
   * @inheritDoc
   */
  static read(reader) {
    const attributes = {};
    for (const [fieldName, type] of this._fields) {
      attributes[fieldName] = type.read(reader);
    }
    return new this(attributes);
  }

  /**
   * @inheritDoc
   */
  static write(value, writer) {
    if (!(value instanceof this))
      throw new XdrWriterError(`${value} is not a ${this.structName}`);

    for (const [fieldName, type] of this._fields) {
      const attribute = value._attributes[fieldName];
      type.write(attribute, writer);
    }
  }

  /**
   * @inheritDoc
   */
  static isValid(value) {
    return value instanceof this;
  }

  static create(context, name, fields) {
    const ChildStruct = class extends Struct {};

    ChildStruct.structName = name;

    context.results[name] = ChildStruct;

    const mappedFields = new Array(fields.length);
    for (let i = 0; i < fields.length; i++) {
      const fieldDescriptor = fields[i];
      const fieldName = fieldDescriptor[0];
      let field = fieldDescriptor[1];
      if (field instanceof Reference) {
        field = field.resolve(context);
      }
      mappedFields[i] = [fieldName, field];
      // create accessors
      ChildStruct.prototype[fieldName] = createAccessorMethod(fieldName);
    }

    ChildStruct._fields = mappedFields;

    return ChildStruct;
  }
}

function createAccessorMethod(name) {
  return function readOrWriteAttribute(value) {
    if (value !== undefined) {
      this._attributes[name] = value;
    }
    return this._attributes[name];
  };
}
