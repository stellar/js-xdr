
module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    browsers : ['PhantomJS', "Firefox"],
    browserNoActivityTimeout: 20000,

    entry: ['babel-polyfill'],
    files: [
      'dist/xdr.js',
      'test/unit/**/*.js'
    ],

    preprocessors: {
      'test/unit/**/*.js': ['webpack']
    },

    webpack: require("./webpack.config")(),

    webpackMiddleware: {
      noInfo: true
    },

    singleRun: true,

    reporters: ['dots'],
  });
};
