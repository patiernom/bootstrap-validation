'use strict';

var lazypipe = require('lazypipe'),
    path = require('path'),
    R = require('ramda');

/*jshint -W083 */
module.exports = function (gulp, plugins, helpers) {
    var libraries = helpers.getLibrary("config").js,
        gulpSequence = plugins.sequence.use(gulp),
        sequence = [],
        getSourceFile = function(source){
            var output = [];

            source.forEach(function(item){
                output.push(item.root + item.directory + item.filename);
            });

            return output;
        },
        exludeExternalSource = function(source) {
            var condition = R.whereEq({external: true}),
                output = [];

            source.forEach(function(item){
                if (condition(item)) {
                    output.push('!' + item.filename);
                }
            });

            return output;
        },
        jsGenertion = function(library, done){
            console.log('Start to generate js Framework ' + library.libname + ' -  destination folder: ' + path.resolve(library.dest) + ' - map folder: ' + library.maps);

            var jsFilter = plugins.filter(['*'].concat(exludeExternalSource(library.srcfiles)), {restore: true});

            gulp.src(getSourceFile(library.srcfiles))
                // .pipe(jsFilter)
                // .pipe(plugins.jshint(library.jshintrc))
                // .pipe(plugins.jscs(library.jscsrc))
                // .pipe(plugins.jshint.reporter('jshint-stylish'))
                // .pipe(jsFilter.restore)
                .pipe(plugins.sourcemaps.init())
                .pipe(plugins.concat('all.js', {newLine: '\n'}))
                .pipe(plugins.uglify())
                .pipe(plugins.rename({basename: library.libname, suffix: '.min'}))
                .pipe(plugins.sourcemaps.write(library.maps))
                .pipe(gulp.dest(path.resolve(library.dest)))
                .on('end', done);
        };

    for (var key in libraries) {
        if (libraries.hasOwnProperty(key)){
            sequence.push(key);
            (function(index){
                gulp.task(index, function (cb) {
                    jsGenertion(libraries[index], cb);
                });
            })(key);
        }
    }

    return gulpSequence(sequence);
};

module.exports.dependecies = [];
