'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var plumber = require('gulp-plumber');

gulp.task('lint:src', function lintSrc() {
  return gulp
    .src(['src/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

// Lint our test code
gulp.task('lint:test', function lintTest() {
  return gulp
    .src(['test/unit/**/*.js'])
    .pipe(plumber())
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

gulp.task(
  'build:node',
  gulp.series('lint:src', function buildNode() {
    return gulp
      .src('src/**/*.js')
      .pipe(plugins.babel())
      .pipe(gulp.dest('lib'));
  })
);

gulp.task(
  'build:browser',
  gulp.series('lint:src', function buildBrowser() {
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
  })
);

gulp.task('test:node', function testNode() {
  return gulp.src(['test/setup/node.js', 'test/unit/**/*.js']).pipe(
    plugins.mocha({
      reporter: ['dot']
    })
  );
});

gulp.task(
  'test:browser',
  gulp.series('build:browser', function testBrowser(done) {
    const Server = require('karma').Server;
    const server = new Server(
      { configFile: __dirname + '/karma.conf.js' },
      (exitCode) => {
        if (exitCode !== 0) {
          done(new Error(`Bad exit code ${exitCode}`));
        } else {
          done();
        }
      }
    );
    server.start();
  })
);

gulp.task('clean', function clean() {
  return gulp
    .src('dist', { read: false, allowEmpty: true })
    .pipe(plugins.rimraf());
});

gulp.task(
  'watch:lint',
  gulp.series('lint:src', function watchLint() {
    gulp.watch('src/**/*', ['lint:src']);
  })
);

gulp.task('submit-coverage', function submitCoverage(cb) {
  return gulp.src('./coverage/**/lcov.info').pipe(plugins.coveralls());
});

gulp.task('build', gulp.series('clean', 'build:node', 'build:browser'));

gulp.task(
  'watch',
  gulp.series('build', function watch() {
    gulp.watch('lib/**/*', ['build']);
  })
);

gulp.task(
  'hooks:precommit',
  gulp.series('build', function hooksPrecommit() {
    return gulp
      .src(['dist/*', 'lib/*'], { allowEmpty: true })
      .pipe(plugins.git.add());
  })
);

gulp.task('test', gulp.series('clean', 'test:node', 'test:browser'));

gulp.task('default', gulp.series('build'));
