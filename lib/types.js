"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

_defaults(exports, _interopRequireWildcard(require("./int")));

_defaults(exports, _interopRequireWildcard(require("./hyper")));

_defaults(exports, _interopRequireWildcard(require("./unsigned-int")));

_defaults(exports, _interopRequireWildcard(require("./unsigned-hyper")));

_defaults(exports, _interopRequireWildcard(require("./float")));

_defaults(exports, _interopRequireWildcard(require("./double")));

_defaults(exports, _interopRequireWildcard(require("./quadruple")));

_defaults(exports, _interopRequireWildcard(require("./bool")));

_defaults(exports, _interopRequireWildcard(require("./string")));

_defaults(exports, _interopRequireWildcard(require("./opaque")));

_defaults(exports, _interopRequireWildcard(require("./var-opaque")));

_defaults(exports, _interopRequireWildcard(require("./array")));

_defaults(exports, _interopRequireWildcard(require("./var-array")));

_defaults(exports, _interopRequireWildcard(require("./option")));

_defaults(exports, _interopRequireWildcard(require("./void")));

_defaults(exports, _interopRequireWildcard(require("./enum")));

_defaults(exports, _interopRequireWildcard(require("./struct")));

_defaults(exports, _interopRequireWildcard(require("./union")));