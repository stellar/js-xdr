import { isSerializableIsh } from '../../src/xdr-type';
import { Union } from '../../src/union';

describe('duck-typing serialization', function () {
  class XdrCompositeType {}
  class Duck extends XdrCompositeType {
    write() {}
    read() {}
  }
  class Duckling extends Duck {}

  it('respects ducks', function () {
    expect(isSerializableIsh(new Duck(), XdrCompositeType)).to.be.true;
    expect(isSerializableIsh(new Duck(), Duck)).to.be.true;
    expect(isSerializableIsh(new Duckling(), Duck)).to.be.true;
    expect(isSerializableIsh(new Duckling(), Duckling)).to.be.true;
  });

  class LiterateDuck extends XdrCompositeType {
    read() {}
  }
  class Platypus extends LiterateDuck {}
  it('does not respect non-ducks', function () {
    expect(isSerializableIsh(new Platypus(), Duck)).to.be.false;
    expect(isSerializableIsh(new Platypus(), XdrCompositeType)).to.be.true;
    expect(isSerializableIsh(new LiterateDuck(), LiterateDuck)).to.be.true;
    expect(isSerializableIsh(new Platypus(), Union)).to.be.false;
  });
});
