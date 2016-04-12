'use strict';

var path = require('path');

/*jshint -W083 */
module.exports = function (gulp, plugins, helpers) {
    var libraries = helpers.getLibrary("config").css,
        gulpSequence = plugins.sequence.use(gulp),
        sequence = [],
        getSourceFile = function (source) {
            var output = [];

            source.forEach(function (item) {
                output.push(item.root + item.directory + item.filename);
            });

            return output;
        },
        cssGenertion = function (library, done) {
            console.log('Start to generate css Framework ' + library.libname + ' -  destination folder: ' + library.dest + ' - map folder: ' + library.maps);

            gulp.src(getSourceFile(library.srcfiles))
                .pipe(plugins.csslint(path.resolve(library.csslintrc)))
                .pipe(plugins.csslint.reporter())
                .pipe(plugins.concat('all.css'))
                .pipe(plugins.sourcemaps.init())
                .pipe(plugins.minifyCss())
                .pipe(plugins.rename({basename: library.libname, suffix: '.min'}))
                .pipe(plugins.sourcemaps.write(library.maps))
                .pipe(gulp.dest(path.resolve(library.dest)))
                .on('end', done);
        };

    for (var key in libraries) {
        if (libraries.hasOwnProperty(key)) {
            sequence.push(key);
            (function (index) {
                gulp.task(index, function (cb) {
                    cssGenertion(libraries[index], cb);
                });
            })(key);
        }
    }

    return gulpSequence(sequence);
};

module.exports.dependecies = ['lessFramework'];
