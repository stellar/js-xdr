'use strict';

var gulp          = require('gulp');
var plugins       = require('gulp-load-plugins')();
var runSequence   = require('run-sequence');
var webpack       = require('webpack-stream');
var webpackConfig = require('./webpack.config');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

gulp.task('default', ['build']);

gulp.task('lint:src', function() {
  return gulp.src(['src/**/*.js'])
    .pipe(plugins.plumber())
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'));
});

// Lint our test code
gulp.task('lint:test', function() {
  return gulp.src(['test/unit/**/*.js'])
    .pipe(plugins.plumber())
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('build', function(done) {
  runSequence('clean', 'build:node', 'build:browser', done);
});

gulp.task('test', function(done) {
  runSequence('clean', 'test:node', 'test:browser', done);
});


gulp.task('hooks:precommit', ['build'], function() {
  return gulp.src(['dist/*', 'lib/*'])
    .pipe(plugins.git.add());
});

gulp.task('analyze:node', [], function() {
  var wconf = webpackConfig({
    plugins: [new BundleAnalyzerPlugin({
      analyzerMode: 'static',
    })]
  });

  return gulp.src('src/index.js').pipe(webpack(wconf))
});

gulp.task('analyze:browser', ['lint:src'], function() {
  var wconf = webpackConfig({
    plugins: [new BundleAnalyzerPlugin({
      analyzerMode: 'static',
    })]
  });

  return gulp.src('src/browser.js').pipe(webpack(wconf))
});

gulp.task('build:node', ['lint:src'], function() {
    return gulp.src('src/**/*.js')
        .pipe(plugins.babel({
          presets: ['env'],
          plugins: [["transform-runtime", { "polyfill": false }]]
        }))
        .pipe(gulp.dest('lib'));
});

gulp.task('build:browser', ['lint:src'], function() {
  var wconf = webpackConfig({output: { library: 'XDR' }});

  return gulp.src('src/browser.js')
    .pipe(webpack(wconf))
    .pipe(plugins.rename('xdr.js'))
    .pipe(gulp.dest('dist'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename('xdr.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('test:node', function() {
  return gulp.src(["test/setup/node.js", "test/unit/**/*.js"])
    .pipe(plugins.mocha({
      reporter: ['dot'],
      require: ["babel-register"]
    }));
});

gulp.task('test:browser', ["build:browser"], function (done) {
  var karma = require('karma');
  var server = new karma.Server({ configFile: __dirname + '/karma.conf.js' }, done);
  server.start();
});

gulp.task('clean', function () {
  return gulp.src('dist', { read: false })
      .pipe(plugins.rimraf());
});

gulp.task('watch', ['build'], function() {
  gulp.watch('lib/**/*', ['build']);
});

gulp.task('submit-coverage', function(cb) {
  return gulp
      .src("./coverage/**/lcov.info")
      .pipe(plugins.coveralls());
});
