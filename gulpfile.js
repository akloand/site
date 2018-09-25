var translate = require('gulp-translator');
const gulp = require('gulp');

gulp.task('translate', function() {
  var translations = ['ru', 'en'];
 
  translations.forEach(function(translation){
    gulp.src('src/*.html')
      .pipe(
        translate('./locales/' + translation + '.yml')
        .on('error', function(){
          console.error(arguments);
        })
      )
      .pipe(gulp.dest('./build/' + translation));
  });
});