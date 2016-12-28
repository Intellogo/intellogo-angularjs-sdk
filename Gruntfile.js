'use strict';

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({
        ngAnnotate: {
            app: {
                files: [{
                    expand: true,
                    cwd: 'src/scripts',
                    src: ['**/*.js'],
                    dest: '.tmp/annotated'
                }]
            }
        },
        concat: {
            js: {
                src: ['.tmp/annotated/**/*.js'],
                dest: 'dist/intellogo-sdk.js'
            }
        },
        uglify: {
            js: {
                src: ['dist/intellogo-sdk.js'],
                dest: 'dist/intellogo-sdk.min.js'
            }
        },
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                browsers: ['PhantomJS'],
                reporters: ['dots'],
                singleRun: true,
/*                junitReporter: {
                    outputFile: 'test-results.xml'
                },
                coverageReporter: {
                    type: 'cobertura',
                    dir: 'coverage',
                    reporters: [
                        {type: 'cobertura', subdir: '.', file: 'cobertura.xml'}
                    ]
                } */
            }
        }
    });

    grunt.registerTask(
        'test',
        'Run tests',
        function (target) {
            var karmaTarget = ({
                    ci: 'unitCi',
                    all: 'unitAllBrowsers'
                }[target]) || 'unit';

            grunt.task.run([
                               'karma:' + karmaTarget
                           ]);
        });

    grunt.registerTask(
        'build', ['ngAnnotate', 'concat', 'uglify']);
};
