import * as XDR from "../../src";
import { keys, each } from "lodash";

describe('XDR.define', function() {

  beforeEach(function() {
    this.types = XDR.define(); // get the xdr object root
    let toDelete = keys(this.types);
    each(toDelete, k => delete this.types[k]);
  });
  
  it('can define objects that have no dependency', function() {
    XDR.define(xdr => {
      xdr.enum('Color', {
        red: 0,
        green: 1,
        blue: 2,
      });

      xdr.enum('ResultType', {
        ok: 0,
        error: 1
      });
    });

    expect(this.types.Color).to.be.truthy;
    expect(this.types.ResultType).to.be.truthy;
  });


  it('can define objects that have simple dependencies', function() {
    XDR.define(xdr => {
      xdr.union('Result', {
        switchOn: xdr.lookup('ResultType'),
        switches: {
          ok:      XDR.Void,
          error:   "message"
        },
        defaultArm: XDR.Void,
        arms: {
          message: new XDR.String(100)
        }
      });

      xdr.enum('ResultType', {
        ok: 0,
        error: 1
      });
    });

    expect(this.types.Result).to.be.truthy;
    expect(this.types.ResultType).to.be.truthy;

    let result = this.types.Result.ok();
    expect(result.switch()).to.eql(this.types.ResultType.ok());

    result = this.types.Result.error("It broke!");
    expect(result.switch()).to.eql(this.types.ResultType.error());
    expect(result.message()).to.eql("It broke!");
  });


  it('can define structs', function() {
    XDR.define(xdr => {
      xdr.struct("Color", [
        ["red", xdr.int()],
        ["green", xdr.int()],
        ["blue", xdr.int()],
      ]);
    });

    expect(this.types.Color).to.be.truthy;

    let result = new this.types.Color({
      red: 0,
      green: 1,
      blue: 2,
    });
    expect(result.red()).to.eql(0);
    expect(result.green()).to.eql(1);
    expect(result.blue()).to.eql(2);
  });


  it('can define typedefs', function() {
    let xdr = XDR.define(xdr => {
      xdr.typedef("Uint256", xdr.opaque(32) );
    });
    expect(xdr.Uint256).to.be.instanceof(XDR.Opaque);
  });

  it('can define consts', function() {
    let xdr = XDR.define(xdr => {
      xdr.typedef("MAX_SIZE", 300 );
    });
    expect(xdr.MAX_SIZE).to.eql(300);
  });

  it('can define arrays', function() {
    let xdr = XDR.define(xdr => {
      xdr.typedef("ArrayOfInts", xdr.array(xdr.int(), 3) );
      xdr.struct('MyStruct', [["red", xdr.int()]]);
      xdr.typedef("ArrayOfEmpty", xdr.array(xdr.lookup("MyStruct"), 5) );
    });

    expect(xdr.ArrayOfInts).to.be.instanceof(XDR.Array);
    expect(xdr.ArrayOfInts._childType).to.eql(XDR.Int);
    expect(xdr.ArrayOfInts._length).to.eql(3);

    expect(xdr.ArrayOfEmpty).to.be.instanceof(XDR.Array);
    expect(xdr.ArrayOfEmpty._childType).to.eql(xdr.MyStruct);
    expect(xdr.ArrayOfEmpty._length).to.eql(5);

  });

  it('can define vararrays', function() {
    let xdr = XDR.define(xdr => {
      xdr.typedef("ArrayOfInts", xdr.varArray(xdr.int(), 3) );
    });

    expect(xdr.ArrayOfInts).to.be.instanceof(XDR.VarArray);
    expect(xdr.ArrayOfInts._childType).to.eql(XDR.Int);
    expect(xdr.ArrayOfInts._maxLength).to.eql(3);


  });

  it('can define options', function() {
    let xdr = XDR.define(xdr => {
      xdr.typedef("OptionalInt", xdr.option(xdr.int()) );
    });

    expect(xdr.OptionalInt).to.be.instanceof(XDR.Option);
    expect(xdr.OptionalInt._childType).to.eql(XDR.Int);


  });
});