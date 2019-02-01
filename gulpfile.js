'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var plumber = require('gulp-plumber');

gulp.task('default', ['build']);

gulp.task('lint:src', function() {
  return gulp
    .src(['src/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

// Lint our test code
gulp.task('lint:test', function() {
  return gulp
    .src(['test/unit/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

gulp.task('build', function(done) {
  runSequence('clean', 'build:node', 'build:browser', done);
});

gulp.task('test', function(done) {
  runSequence('clean', 'test:node', 'test:browser', done);
});

gulp.task('hooks:precommit', ['build'], function() {
  return gulp.src(['dist/*', 'lib/*']).pipe(plugins.git.add());
});

gulp.task('build:node', ['lint:src'], function() {
  return gulp
    .src('src/**/*.js')
    .pipe(plugins.babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('build:browser', ['lint:src'], function() {
  return gulp
    .src('src/browser.js')
    .pipe(
      plugins.webpack({
        output: { library: 'XDR' },
        module: {
          loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
          ]
        }
      })
    )
    .pipe(plugins.rename('xdr.js'))
    .pipe(gulp.dest('dist'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename('xdr.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('test:node', function() {
  return gulp.src(['test/setup/node.js', 'test/unit/**/*.js']).pipe(
    plugins.mocha({
      reporter: ['dot']
    })
  );
});

gulp.task('test:browser', ['build:browser'], function(done) {
  var karma = require('karma').server;

  karma.start({ configFile: __dirname + '/karma.conf.js' }, done);
});

gulp.task('clean', function() {
  return gulp.src('dist', { read: false }).pipe(plugins.rimraf());
});

gulp.task('watch', ['build'], function() {
  gulp.watch('lib/**/*', ['build']);
});
gulp.task('watch:lint', ['lint:src'], function() {
  gulp.watch('src/**/*', ['lint:src']);
});

gulp.task('submit-coverage', function(cb) {
  return gulp.src('./coverage/**/lcov.info').pipe(plugins.coveralls());
});
