let Bool = XDR.Bool;
import { bufferToArray } from "../support/buffer-helpers";

describe('Bool.read', function() {

  it('decodes correctly', function() {
    expect(read([0,0,0,0])).to.eql(false);
    expect(read([0,0,0,1])).to.eql(true);

    expect(() => read([0,0,0,2])).to.throw(/read error/i);
    expect(() => read([255,255,255,255])).to.throw(/read error/i);
  });

  function read(bytes) {
    let buffer = new Buffer(bytes);
    return Bool.read(buffer, 0);
  }
});

describe('Bool.write', function() {

  it('encodes correctly', function() {
    expect(write(false)).to.eql([0,0,0,0]);
    expect(write(true)).to.eql([0,0,0,1]);
  });

  it('returns the number of bytes written (4)', function() {
    let buffer = new Buffer(8);
    expect(Bool.write(0, buffer, 0)).to.eql(4);
  });

  function write(value) {
    let buffer       = new Buffer(8);
    let bytesWritten = Bool.write(value, buffer, 0);
    return bufferToArray(buffer, bytesWritten);
  }
});

describe('Bool.isValid', function() {

  it('returns true for booleans', function() {
    expect(Bool.isValid(true)).to.be.true;
    expect(Bool.isValid(false)).to.be.true;
  });

  it('returns false for non booleans', function() {
    expect(Bool.isValid(0)).to.be.false;
    expect(Bool.isValid("0")).to.be.false;
    expect(Bool.isValid([true])).to.be.false;
    expect(Bool.isValid(null)).to.be.false;
    expect(Bool.isValid({})).to.be.false;
    expect(Bool.isValid(undefined)).to.be.false;
  });

});

