'use strict';

var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');

gulp.task('deploy', ['clean', 'build'], function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});
