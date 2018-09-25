var translate = require('gulp-translator');
const gulp = require('gulp');

var options = {
	localeDirectory: './locales/',
	localeExt: '.yml',
	transform: {
		escapeQuotes: (content, dict) => content.replace(/"/g, '&quot;').replace(/\r?\n/g, ' '),
	}

}

gulp.task('translate', function() {
  var translations = ['ru', 'en'];
 
  translations.forEach(function(translation){
  	options.lang = translation;
    gulp.src('src/*.html')
      .pipe(
        translate(options)
        .on('error', function(){
          console.error(arguments);
        })
      )
      .pipe(gulp.dest('./' + translation));
  });
});