'use strict';

module.exports = function (gulp, plugins, helpers) {
    return function () {
        var tests = ['./tests/*.js', './tests/**/*.js', '!./tests/{temp,temp/**}'];
        return gulp.src(tests, {read: false})
            .pipe(plugins.mocha());
    }
};