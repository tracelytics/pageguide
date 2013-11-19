module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Task Configuration
    clean: {
      dist: ['dist']
    },

    jshint: {
      options: {
        jshintrc: 'js/.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['js/*.js']
      },
      //test: {
      //  src: ['js/tests/unit/*.js']
      //}
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'js/<%= pkg.name %>.js',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      }
    },

    recess: {
      options: {
        compile: true,
        banner: '<%= banner %>'
      },
      dist: {
        options: {
          compress: true
        },
        src: ['less/<%= pkg.name %>.less'],
        dest: 'dist/css/<%= pkg.name %>.min.css'
      }
    },

    connect: {
      server: {
        options: {
          keepalive: true,
          port: 3000,
        }
      }
    },

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-recess');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'jshint', 'uglify', 'recess']);
  grunt.registerTask('server', ['default', 'connect']);

};
