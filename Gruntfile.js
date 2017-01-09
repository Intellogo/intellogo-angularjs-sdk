'use strict';

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({
        run: {
            installBower: {
                cmd: 'bower',
                args: ['install', '--allow-root']
            }
        },
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
                singleRun: true
            }
        },
        clean: {
            bowerComponents: {
                files: [{
                    dot: true,
                    src: ['bower_components']
                }]
            },
            app: {
                files: [{
                    dot: true,
                    src: [
                        './.tmp',
                        './dist'
                    ]
                }]
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
                'clean',
                'run:installBower',
                'karma:' + karmaTarget
            ]);
        });

    grunt.registerTask('build', ['clean', 'run:installBower', 'ngAnnotate', 'concat', 'uglify']);
};
