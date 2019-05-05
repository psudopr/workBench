//load Gulp
const { src, dest, task, watch, series, parallel } = require('gulp');

//CSS plugins
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');

//JS plugins
const uglify = require('gulp-uglify');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const stripDebug = require('gulp-strip-debug');

//Utility plugins
const nodemon = require('gulp-nodemon');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const wait = require('gulp-wait');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const options = require('gulp-options');
const gulpif = require('gulp-if');
const del = require('del');

//Browser plugins
const bs = require('browser-sync').create();

//Project Variables
const styleSRCDir = './src/scss/**/*.scss';
const styleBundle = './src/scss/style.scss';
const styleDist = './public/stylesheets/';
const mapURL = './';

// todo -- need to look at this
const jsSRC = './src/js/';
const jsFront = 'main.js';
const jsFiles = [jsFront];
const jsDist = './public/javascripts/';

const imgSRC = './src/img/**/*';
const imgDist = './public/images/';

const fontsSRC = './src/fonts/**/*';
const fontsDist = './public/fonts/';

const htmlSRC = (['views/**/*.pug', 'views/**/*.html']);
const htmlURL = '';

//Watch variables 
const styleWatch = './src/scss/**/*.scss';
const jsWatch = './src/js/**/*.js';
const imgWatch = './src/img/**/*.*';
const fontsWatch = './src/fonts/*.*';
const htmlWatch = './views/**/*.*';

//Tasks
function callNodemon(cb) {
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
      }, wait(300));
    });
}

function callBrowserSync() {
  bs.init({
    // server: {
    //   baseDir: 'public/'
    // },
    proxy: 'localhost:3000',
    browser: 'chrome',
    port: 8000,
    tunnel: false //change to true if you can't control firewall settings 
  });
}

function reload(done) {
  bs.reload();
  done();
}

function delSweep() {
  (async () => {
    const deletedPaths = await del(['src/scss/bundle.css', 'public/stylesheets/style.min.css'],
      {
        dryRun: false
      });
    console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
  })();
}

function concatSCSS() {
  // (async () => {
  //   await delSweep()
  //   console.log('delSweep done')
  // })();
  return src('src/scss/**/*.scss')
    .pipe(concat('bundle.scss'))
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: 'expanded' //compressed
    }))
    .on('error', console.error.bind(console))
    .pipe(dest('src/scss/'));
}

function css(done) {
  src('./src/scss/bundle.css')
    .pipe(cleanCSS())
    .pipe(sourcemaps.init())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    }))
    .pipe(rename({
      basename: 'style',
      suffix: '.min'
    }))
    .pipe(sourcemaps.write(mapURL))
    .pipe(dest('./public/stylesheets/'));
  done();
}

function js(done) {
  jsFiles.map(function (entry) {
    return browserify({
      entries: [jsSRC + entry]
    })
      .transform(babelify, {
        presets: ['@babel/preset-env']
      })
      .bundle()
      .pipe(source(entry))
      .pipe(rename({
        extname: '.min.js'
      }))
      .pipe(buffer())
      .pipe(gulpif(options.has('production'), stripDebug()))
      .pipe(sourcemaps.init({
        loadMaps: true
      }))
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(dest(jsDist))
  });
  done();
}

function triggerPlumber(src_file, dest_file) {
  return src(src_file)
    .pipe(plumber())
    .pipe(dest(dest_file));
}

function images() {
  return triggerPlumber(imgSRC, imgDist);
}

function fonts() {
  return triggerPlumber(fontsSRC, fontsDist);
}

function html(done) {
  //express takes care of this, no need for an additional task 
  // src([styleSRC]);
  // return bs.reload();
  done();
}

function watch_files() {
  watch(styleWatch, series(concatSCSS, css, reload));
  watch(jsWatch, series(js, reload));
  watch(imgWatch, series(images, reload));
  watch(fontsWatch, series(fonts, reload));
  watch(htmlWatch, series(html, reload));
  src(jsDist + 'main.min.js')
    .pipe(notify({
      message: 'Gulp is Watching, Happy Coding!'
    }));
}

task('delSweep', delSweep);
task('concatSCSS', series(delSweep, concatSCSS));
task('css', series(css));
task('js', js);
task('images', images);
task('fonts', fonts);
task('html', html);
task('callNodemon', callNodemon);
task('bs', callBrowserSync);
task('build', series(concatSCSS, css, js));
task('default', parallel(callNodemon, callBrowserSync, concatSCSS, css, js, images, fonts, watch_files));