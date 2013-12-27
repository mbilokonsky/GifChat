module.exports = function(grunt) {
    grunt.initConfig({
        browserify: {
            js: {
                // A single entry point for our app
                src: 'public_source/js/app.js',
                // Compile to a single file to add a script tag for in your HTML
                dest: 'public/js/app.js'
            }
        },
        copy: {
            all: {
                // This copies all the html and css into the dist/ folder
                expand: true,
                cwd: 'public_source/',
                src: ['**/*.html', '**/*.css'],
                dest: 'public/'
            }
        },
        watch: {
            scripts: {
                files: "**/*.js",
                tasks: ["browserify", "copy"]
            }
        }
    });

    // Load the npm installed tasks
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // The default tasks to run when you type: grunt
    grunt.registerTask('default', ['browserify', 'copy']);
};