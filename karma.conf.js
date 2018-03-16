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

    webpack: {
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
    },

    webpackMiddleware: {
      noInfo: true
    },

    singleRun: true,

    reporters: ['dots'],
  });
};
