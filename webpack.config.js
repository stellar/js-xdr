var extend = require('lodash/extend');

var defaultConfig = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['env'],
          plugins: [["transform-runtime", { "polyfill": false }]],
        }
      }
    ]
  }
}

module.exports = (opts) => {
  return extend({}, defaultConfig, opts);
}
