# XDR, for Javascript

Read/write XDR encoded data structures (RFC 4506)

[![Travis build status](http://img.shields.io/travis/stellar/js-xdr.svg?style=flat)](https://travis-ci.org/stellar/js-xdr)
[![Code Climate](https://codeclimate.com/github/stellar/js-xdr/badges/gpa.svg)](https://codeclimate.com/github/stellar/js-xdr)
[![Dependency Status](https://david-dm.org/stellar/js-xdr.svg)](https://david-dm.org/stellar/js-xdr)
[![devDependency Status](https://david-dm.org/stellar/js-xdr/dev-status.svg)](https://david-dm.org/stellar/js-xdr#info=devDependencies)

XDR is an open data format, specified in [RFC 4506](http://tools.ietf.org/html/rfc4506.html).  This library provides a way to read and write XDR data from javascript.  It can read/write all of the primitive XDR types and also provides facilities to define readers for the compound XDR types (enums, structs and unions)

## Installation

via npm:

```shell
npm install --save js-xdr
```

## Usage

You can find some [examples here.](examples)

First, let's import the library:

```javascript
var xdr = require("js-xdr");
```

Now, let's look at how to decode some primitive types:

```javascript
// booleans
xdr.Bool.fromXDR([0,0,0,0]) // returns false
xdr.Bool.fromXDR([0,0,0,1]) // returns true

// the inverse of `fromXDR` is `toXDR`, which returns a Buffer
xdr.Bool.toXDR(true) // returns new Buffer([0,0,0,1])

// XDR ints and unsigned ints can be safely represented as
// a javascript number

xdr.Int.fromXDR([0xFF,0xFF,0xFF,0xFF]) // returns -1
xdr.UnsignedInt.fromXDR([0xFF,0xFF,0xFF,0xFF]) // returns 4294967295

// XDR Hypers, however, cannot be safely represented in the 53-bits
// of precision we get with javascript numbers, and so we have a custom class 
// for those numbers.  Hyper and UnsignedHyper both use 
//https://www.npmjs.com/package/long to represent the 64-bit numbers

var result = xdr.Hyper.fromXDR([0,0,0,0,0,0,0,0]) // returns an instance of xdr.Hyper

// convert the hyper to a string
result.toString() // return '0'

// math!
var ten = result.add(10)
var minusone = result.subtract(1)

// construct a number from a string
var big = xdr.Hyper.fromString("1099511627776")

// encode the hyper back into xdr
big.toXDR() // <Buffer 00 00 01 00 00 00 00 00> 
```


## Caveats

There are a couple of caveats to be aware of with this library:

1.  We do not support quadruple precision floating point values.  Attempting to read or write these values will throw errors.
2.  NaN is not handled perfectly for floats and doubles.  There are several forms of NaN as defined by IEEE754 and the browser polyfill for node's Buffer class seems to handle them poorly.  


## Code generation

js-xdr by itself does not have any ability to parse XDR IDL files and produce a parser for your custom data types.  Instead, that is the responsibility of [xdrgen](http://github.com/stellar/xdrgen).  xdrgen will take your .x files and produce a javascript file that target this library to allow for your own custom types.

See [js-stellar-base](http://github.com/stellar/js-stellar-base) for an example (check out the src/generated directory)

## Contributing

Please [see CONTRIBUTING.md for details](CONTRIBUTING.md).

