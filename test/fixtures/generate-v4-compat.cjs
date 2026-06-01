/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const XDR = require('js-xdr-v4');
const { version } = require('js-xdr-v4/package.json');

const outputPath = path.join(__dirname, 'v4-compat.json');

const types = XDR.config((xdr) => {
  xdr.enum('Color', {
    red: 0,
    green: 1,
    blue: 2
  });

  xdr.struct('CompatRecord', [
    ['i', xdr.int()],
    ['u', xdr.uint()],
    ['h', xdr.hyper()],
    ['uh', xdr.uhyper()],
    ['ok', xdr.bool()],
    ['f', xdr.float()],
    ['d', xdr.double()],
    ['name', xdr.string(16)],
    ['fixed', xdr.opaque(3)],
    ['varBytes', xdr.varOpaque(8)],
    ['fixedInts', xdr.array(xdr.int(), 3)],
    ['varInts', xdr.varArray(xdr.int(), 4)],
    ['maybe', xdr.option(xdr.int())],
    ['color', xdr.lookup('Color')]
  ]);

  xdr.enum('ResultType', {
    ok: 0,
    error: 1
  });

  xdr.union('Result', {
    switchOn: xdr.lookup('ResultType'),
    switches: [
      ['ok', xdr.void()],
      ['error', 'message']
    ],
    arms: {
      message: xdr.string(100)
    }
  });

  xdr.struct('IntList', [
    ['value', xdr.int()],
    ['rest', xdr.option(xdr.lookup('IntList'))]
  ]);

  // A deeply nested composite: Scene -> Layer -> [Shape (union)] -> Polygon
  // -> [Point]. Exercises wire compatibility for several layers of nested
  // structs, unions, arrays, and options.
  xdr.struct('Point', [
    ['x', xdr.int()],
    ['y', xdr.int()]
  ]);

  xdr.struct('Polygon', [
    ['vertices', xdr.varArray(xdr.lookup('Point'), 8)],
    ['closed', xdr.bool()]
  ]);

  xdr.enum('ShapeKind', {
    dot: 0,
    poly: 1
  });

  xdr.union('Shape', {
    switchOn: xdr.lookup('ShapeKind'),
    switches: [
      ['dot', 'center'],
      ['poly', 'polygon']
    ],
    arms: {
      center: xdr.lookup('Point'),
      polygon: xdr.lookup('Polygon')
    }
  });

  xdr.struct('Layer', [
    ['label', xdr.string(8)],
    ['shapes', xdr.varArray(xdr.lookup('Shape'), 4)]
  ]);

  xdr.struct('Scene', [
    ['name', xdr.string(16)],
    ['root', xdr.lookup('Layer')],
    ['fallback', xdr.option(xdr.lookup('Shape'))]
  ]);
});

function toHex(value) {
  return Buffer.from(value).toString('hex');
}

const compatRecord = new types.CompatRecord({
  i: -1,
  u: 4294967295,
  h: new XDR.Hyper(-1234567890123n),
  uh: new XDR.UnsignedHyper(1234567890123n),
  ok: true,
  f: 1.5,
  d: -2.25,
  name: 'hi',
  fixed: Buffer.from([1, 2, 3]),
  varBytes: Buffer.from([4, 5, 6, 7]),
  fixedInts: [1, 2, 3],
  varInts: [4, 5],
  maybe: 9,
  color: types.Color.blue()
});

const resultOk = types.Result.ok();
const resultError = types.Result.error('this is an error');

const listTail = new types.IntList({ value: 1, rest: null });
const linkedList = new types.IntList({ value: 3, rest: listTail });

const scene = new types.Scene({
  name: 'demo',
  root: new types.Layer({
    label: 'base',
    shapes: [
      types.Shape.dot(new types.Point({ x: 1, y: 2 })),
      types.Shape.poly(
        new types.Polygon({
          vertices: [
            new types.Point({ x: 3, y: 4 }),
            new types.Point({ x: 5, y: 6 })
          ],
          closed: true
        })
      )
    ]
  }),
  fallback: types.Shape.dot(new types.Point({ x: 7, y: 8 }))
});

const fixture = {
  generatedBy: {
    package: '@stellar/js-xdr',
    alias: 'js-xdr-v4',
    version,
    script: 'test/fixtures/generate-v4-compat.cjs'
  },
  cases: {
    compatRecord: {
      schema: 'CompatRecord',
      hex: toHex(compatRecord.toXDR()),
      value: {
        i: -1,
        u: 4294967295,
        h: '-1234567890123',
        uh: '1234567890123',
        ok: true,
        f: 1.5,
        d: -2.25,
        name: toHex(Buffer.from('hi')),
        fixed: '010203',
        varBytes: '04050607',
        fixedInts: [1, 2, 3],
        varInts: [4, 5],
        maybe: 9,
        color: 2
      }
    },
    resultOk: {
      schema: 'Result',
      hex: toHex(resultOk.toXDR()),
      value: { type: 0 }
    },
    resultError: {
      schema: 'Result',
      hex: toHex(resultError.toXDR()),
      value: {
        type: 1,
        message: toHex(Buffer.from('this is an error'))
      }
    },
    linkedList: {
      schema: 'IntList',
      hex: toHex(linkedList.toXDR()),
      value: {
        value: 3,
        rest: {
          value: 1,
          rest: null
        }
      }
    },
    scene: {
      schema: 'Scene',
      hex: toHex(scene.toXDR()),
      value: {
        name: toHex(Buffer.from('demo')),
        root: {
          label: toHex(Buffer.from('base')),
          shapes: [
            { type: 0, center: { x: 1, y: 2 } },
            {
              type: 1,
              polygon: {
                vertices: [
                  { x: 3, y: 4 },
                  { x: 5, y: 6 }
                ],
                closed: true
              }
            }
          ]
        },
        fallback: { type: 0, center: { x: 7, y: 8 } }
      }
    }
  }
};

fs.writeFileSync(outputPath, `${JSON.stringify(fixture, null, 2)}\n`);
