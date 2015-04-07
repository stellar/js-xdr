# XDR, for Javascript

Read/write XDR encoded data structures (RFC 4506)

[![Travis build status](http://img.shields.io/travis/stellar/js-xdr.svg?style=flat)](https://travis-ci.org/stellar/js-xdr)
[![Dependency Status](https://david-dm.org/stellar/js-xdr.svg)](https://david-dm.org/stellar/js-xdr)
[![devDependency Status](https://david-dm.org/stellar/js-xdr/dev-status.svg)](https://david-dm.org/stellar/js-xdr#info=devDependencies)

XDR is an open data format, specified in [RFC 4506](http://tools.ietf.org/html/rfc4506.html).  This library provides a way to read and write XDR data from javascript.  It can read/write all of the primitive XDR types and also provides facilities to define readers for the compound XDR types (enums, structs and unions)

## Caveats

There are a couple of caveats to be aware of with this library:

1.  We do not support quadruple precision floating point values.  Attempting to read or write these values will throw errors.
2.  NaN is not handled perfectly for floats and doubles.  There are several forms of NaN as defined by IEEE754 and the browser polyfill for node's Buffer class seems to handle them poorly.  


## Code generation

js-xdr by itself does not have any ability to parse XDR IDL files and produce a parser for your custom data types.  Instead, that is the responsibility of [xdrgen](http://github.com/stellar/xdrgen).  xdrgen will take your .x files and produce a javascript file that target this library to allow for your own custom types.

See [js-stellar-base](http://github.com/stellar/js-stellar-base) for an example (check out the src/generated directory)

