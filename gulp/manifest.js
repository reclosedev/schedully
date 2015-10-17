'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var manifest = require('gulp-manifest');

gulp.task('manifest', function(){
  gulp.src([path.join(conf.paths.dist, '/**')], { base: './dist' })
    .pipe(manifest({
      hash: true,
      network: ['*'],
      filename: 'app.manifest',
      exclude: 'app.manifest'
     }))
    .pipe(gulp.dest(conf.paths.dist));
});
