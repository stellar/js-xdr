import { each, isUndefined } from "lodash";
import { cloneDeep } from "lodash";
import { Void } from "./void";
import includeIoMixin from './io-mixin';

export class Union {

  constructor(aSwitch,value) {
    this.set(aSwitch,value);
  }

  set(aSwitch, value) {
    if (!(aSwitch instanceof this.constructor._switchOn)) {
      aSwitch = this.constructor._switchOn.fromName(aSwitch);
    }

    this._switch  = aSwitch;
    this._arm     = this.constructor.armForSwitch(this._switch);
    this._armType = this.constructor.armTypeForArm(this._arm);
    this._value   = value;
  }

  get(armName=this._arm) {
    if (this._arm !== Void && this._arm !== armName) {
      throw new Error(`${armName} not set`);
    }
    return this._value;
  }

  switch() {
    return this._switch;
  }

  arm() {
    return this._arm;
  }

  armType() {
    return this._armType;
  }

  value() {
    return this._value;
  }

  static armForSwitch(aSwitch) {

    let arm = this._switches.get(aSwitch);

    if (isUndefined(arm)) {
      throw new Error(`Bad union switch: ${aSwitch}`);
    }

    return arm;
  }

  static armTypeForArm(arm) {
    if (arm === Void) {
      return Void;
    } else {
      return this._arms[arm];
    }
  }

  static read(io) {
    let aSwitch = this._switchOn.read(io);
    let arm     = this.armForSwitch(aSwitch);
    let armType = this.armTypeForArm(arm);
    let value   = armType.read(io);
    return new this(aSwitch, value);
  }

  static write(value, io) {
    if(!(value instanceof this)) {
      throw new Error(`XDR Write Error: ${value} is not a ${this.unionName}`);
    }

    this._switchOn.write(value.switch(), io);
    value.armType().write(value.value(), io);
  }

  static isValid(value) {
    return value instanceof this;
  }

  static create(name, config) {
    let ChildUnion = class extends Union {
      constructor(...args) {
        super(...args);
      }
    };

    ChildUnion.unionName      = name;
    ChildUnion._switchOn      = config.switchOn;
    ChildUnion._switches      = new Map();
    ChildUnion._arms          = cloneDeep(config.arms);
    
    each(ChildUnion._switchOn.values(), aSwitch => {

      // build the enum => arm map
      let arm = config.switches[aSwitch.name] || config.defaultArm;
      ChildUnion._switches.set(aSwitch, arm);

      // Add enum-based constrocutors
      ChildUnion[aSwitch.name] = function(value) {
        return new ChildUnion(aSwitch, value);
      };

      // Add enum-based "set" helpers
      ChildUnion.prototype[aSwitch.name] = function(value) {
        return this.set(aSwitch, value);
      };
    });

    // Add arm accessor helpers
    each(ChildUnion._arms, (type, name) => {
      if (type === Void) { return; }

      ChildUnion.prototype[name] = function() {
        return this.get(name);
      };
    });

    return ChildUnion;
  }
}

includeIoMixin(Union);