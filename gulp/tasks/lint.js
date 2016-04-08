'use strict';

module.exports = function (gulp, plugins, helpers) {
    return function () {
        var lint = ['./gulpfile.js', './lib/*.js', './lib/**/*.js', './server/*.js', './tests/*.js', './tests/**/*.js', './webnodes/*.js', './webnodes/**/*.js', '!lib/**/node_modules/**'];

        return gulp.src(lint)
            .pipe(plugins.jshint('.jshintrc'))
            .pipe(plugins.jscs('.jscsrc'))
            .pipe(plugins.jshint.reporter('jshint-stylish'));
    }
};