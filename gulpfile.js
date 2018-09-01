const gulp = require('gulp');
const bs = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const nodemon = require('gulp-nodemon');
const uglify = require('gulp-uglify');

/*
FIRE UP NODEMON
*/

const bs_reload_delay = 500;

gulp.task('nodemon', function (cb) {
  let called = false;
  return nodemon({

    // nodemon our expressjs server
    script: './bin/www',

    // watch core server file(s) that require server restart on change
    watch: ['app.js', 'routes/*.js']

  })
    .on('start', function onStart() {
      // ensure start only got called once
      if (!called) {
        cb();
      }
      called = true;
    })
    .on('restart', function onRestart() {
      // reload connected browsers after a slight delay
      setTimeout(function reload() {
        bs.reload({
          stream: false
        });
      }, bs_reload_delay);
    });
});

gulp.task('browser-sync', ['nodemon', 'scss', 'scripts', 'html'], function () {
  bs.init({
    // server: {
    //     baseDir: "./"
    // },
    proxy: 'localhost:3000',
    browser: 'chrome',
    port: 8000,
    tunnel: true
  });
});

/*
SCRIPTS TASK
*/
gulp.task('scripts', function () {
  gulp.src(['staging/js/**/*.js', '!staging/js/**/*.min.js']) //grabs everything with a .js extension
    .pipe(plumber()) //don't break the pipes
    .pipe(rename({
      suffix: '.min'
    })) //rename file w/ a .min suffix
    .pipe(uglify()) //remove comments and whitespace
    .pipe(gulp.dest('public/js')); //dump file into the public folder
});

/*
SCSS TASK & AUTOPREFIXER
*/
gulp.task('scss', function () {
  gulp.src(['staging/scss/style.scss']) //only grabbing style.scss @include will do the concat
    .pipe(plumber()) //don't break the pipes if error
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError)) //specify outputStyle and watch for errors
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest('public/css')) //confirm destination, 'public/stylesheets'
    .pipe(bs.stream()); //prompt a reload after completion
});

/*
HTML (PUG) WATCH
*/
gulp.task('html', function () {
  gulp.src(['views/**/*.pug', 'views/**/*.html']);
  bs.reload();
});

gulp.task('default', ['browser-sync'], function () {
  gulp.watch('staging/js/**/*.js', ['scripts', bs.reload]);
  gulp.watch('staging/scss/*.scss', ['scss']);
  gulp.watch(['views/**/*.pug', 'views/**/*.html'], ['html']);
});