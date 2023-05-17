const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const browserBuild = !process.argv.includes('--mode=development')

module.exports = function () {
  const mode = browserBuild ? 'production' : 'development';
  const config = {
    mode,
    devtool: 'source-map',
    entry: {
      'xdr': path.join(__dirname, '/src/browser.js'),
      'xdr.min': path.join(__dirname, '/src/browser.js')
    },
    output: {
      path: path.join(__dirname, browserBuild ? './dist' : './lib'),
      filename: '[name].js',
      library: {
        name: 'XDR',
        type: 'umd'
      },
      globalObject: 'this'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode)
      })
    ]
  }
  if (browserBuild) {
    config.optimization = {
      minimize: true,
      minimizer: [new TerserPlugin({
        include: /\.min\.js$/,
        parallel: true,
        terserOptions: {
          format: {
            ascii_only: true
          }
        }
      })]
    }
    config.plugins.push(new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }))
    config.target = "web";
  } else {
    config.target = 'node';
  }
  return config
}