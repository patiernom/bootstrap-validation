/**
 * Grulper
 * Homepage: https://github.com/patiernom/Grulper
 * version: 1.0.0
 * License: MIT
 */

'use strict';

var gulp     = require('gulp'),
    plugins  = require('gulp-load-plugins')(),
    helpers = require('grulper-load-projects')('./gulp/projects.json'),
    tasks    = require('grulper-load-tasks'),
    options = {
        dirname: helpers.projectSetting.projectDirectory + helpers.projectSetting.projectTasks
    };

gulp = tasks(gulp, options, plugins, helpers);

gulp.task('default', helpers.projectSetting.projectTasksDefault);

