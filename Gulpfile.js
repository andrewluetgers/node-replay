const assert      = require('assert');
const del         = require('del');
const eslint      = require('gulp-eslint');
const exec        = require('gulp-exec');
const File        = require('fs');
const gulp        = require('gulp');
const gutil       = require('gulp-util');
const sourcemaps  = require('gulp-sourcemaps');
const babel       = require('gulp-babel');

// gulp clean -> clean generated files
gulp.task('clean', function(done) {
  return del(['lib']);
});

// gulp lint -> errors if code dirty
gulp.task('lint', function () {
  return gulp.src([ 'src/**/*.js', 'test/*.js' ])
    .pipe(eslint())
    .pipe(eslint.formatEach())
    .pipe(eslint.failOnError());
});

gulp.task('compile', function() {
  return gulp
    .src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'));
});

// gulp build -> compile coffee script
gulp.task('build', gulp.series('clean', 'lint', 'compile'));


// gulp watch -> watch for changes and compile
gulp.task('watch', gulp.series('build', function() {
  return gulp.watch('src/*.js', gulp.series('clean', 'build'));
}));

// gulp -> gulp watch
gulp.task('default', gulp.series('watch'));

// Generate a change log summary for this release
// git tag uses the generated .changes file
gulp.task('changes', function() {
  const version   = require('./package.json').version;
  const changelog = File.readFileSync('CHANGELOG.md', 'utf-8');
  const match     = changelog.match(/^## Version (.*) .*\n([\S\s]+?)\n##/m);

  assert(match, 'CHANGELOG.md missing entry: ## Version ' + version);
  assert.equal(match[1], version, 'CHANGELOG.md missing entry for version ' + version);

  const changes   = match[2].trim();
  assert(changes, 'CHANGELOG.md empty entry for version ' + version);
  File.writeFileSync('.changes', changes);
});

// gulp tag -> Tag this release
gulp.task('tag', gulp.series('changes', function() {
  const version = require('./package.json').version;
  const tag     = 'v' + version;

  gutil.log('Tagging this release', tag);
  return gulp.src('.changes')
    .pipe( exec('git add package.json CHANGELOG.md') )
    .pipe( exec('git commit --allow-empty -m "Version ' + version + '"') )
    .pipe( exec('git tag ' + tag + ' --file .changes') )
    .pipe( exec('git push origin ' + tag) )
    .pipe( exec('git push origin master') );
}));



