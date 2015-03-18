let Int = XDR.Int;
import { bufferToArray } from "../support/buffer-helpers";

describe('Int.read', function() {

  it('decodes correctly', function() {
    expect(read([0,0,0,0])).to.eql(0);
    expect(read([0,0,0,1])).to.eql(1);
    expect(read([255,255,255,255])).to.eql(-1);
    expect(read([127,255,255,255])).to.eql(Math.pow(2,31) -1);
    expect(read([128,0,0,0])).to.eql(-Math.pow(2,31));
  });

  function read(bytes) {
    let buffer = new Buffer(bytes);
    return Int.read(buffer, 0);
  }
});

describe('Int.write', function() {

  it('encodes correctly', function() {
    expect(write(0)).to.eql([0,0,0,0]);
    expect(write(1)).to.eql([0,0,0,1]);
    expect(write(-1)).to.eql([255,255,255,255]);
    expect(write(Math.pow(2,31) - 1)).to.eql([127,255,255,255]);
    expect(write(-Math.pow(2,31))).to.eql([128,0,0,0]);
  });

  it('returns the number of bytes written (4)', function() {
    let buffer = new Buffer(8);
    expect(Int.write(0, buffer, 0)).to.eql(4);
  });

  function write(value) {
    let buffer       = new Buffer(8);
    let bytesWritten = Int.write(value, buffer, 0);
    return bufferToArray(buffer, bytesWritten);
  }
});

describe('Int.isValid', function() {

  it('returns true for number in a 32-bit range', function() {
    expect(Int.isValid(0)).to.be.true;
    expect(Int.isValid(-1)).to.be.true;
    expect(Int.isValid(1.0)).to.be.true;
    expect(Int.isValid(Math.pow(2,31) - 1)).to.be.true;
    expect(Int.isValid(-Math.pow(2,31))).to.be.true;
  });

  it('returns false for numbers outside a 32-bit range', function() {
    expect(Int.isValid(Math.pow(2,31))).to.be.false;
    expect(Int.isValid(-(Math.pow(2,31) + 1))).to.be.false;
    expect(Int.isValid(1000000000000)).to.be.false;
  });

  it('returns false for non numbers', function() {
    expect(Int.isValid(true)).to.be.false;
    expect(Int.isValid(false)).to.be.false;
    expect(Int.isValid(null)).to.be.false;
    expect(Int.isValid("0")).to.be.false;
    expect(Int.isValid([])).to.be.false;
    expect(Int.isValid([0])).to.be.false;
    expect(Int.isValid("hello")).to.be.false;
    expect(Int.isValid({why: "hello"})).to.be.false;
    expect(Int.isValid(["how", "do", "you", "do"])).to.be.false;
    expect(Int.isValid(NaN)).to.be.false;
  });

});

