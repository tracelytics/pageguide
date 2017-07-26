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
      test: {
        src: ['js/tests/unit/*.js']
      }
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
        files:[
          {
            expand: true,            // Enable dynamic expansion.
            cwd: 'less',     // Src matches are relative to this path.
            src: ['pageguide*.less'],         // Actual pattern(s) to match.
            extDot: 'last',
            dest: 'dist/css/',    // Destination path prefix.
            ext: '.min.css'
          }
        ]
      },
    },

    qunit: {
      files: ['js/tests/*.html']
    },

    connect: {
      server: {
        options: {
          keepalive: true,
          port: 3000
        }
      }
    },

    multiless : {
      dist: {
        cwd: 'less',
        colors: "color.*.less",
        styles: "style.*.less",
        dest: 'less'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-recess');

  // Helper task to combine all color / style options for compilation
  grunt.registerMultiTask("multiless", "Combine color / style options for processing by recess", function() {

    var path = require("path");

    var colors = grunt.file.expand({ cwd: this.data.cwd }, this.data.colors);
    var styles = grunt.file.expand({ cwd: this.data.cwd }, this.data.styles);

    for (var colorIndex = 0; colorIndex < colors.length; colorIndex++)
    {
      var colorName = colors[colorIndex].replace(/^[^\.]*\.(.*)\.[^\.]*/g, "$1");

      for (var styleIndex = 0; styleIndex < styles.length; styleIndex++)
      {
        var styleName = styles[styleIndex].replace(/^[^\.]*\.(.*)\.[^\.]*/g, "$1");

        var name = "pageguide";

        if (colorName !== "default")
        {
          name += "." + colorName;
        }
        if (styleName !== colorName && styleName != "default")
        {
          name += "." + styleName;
        }
        name += ".less";

        grunt.file.write(path.join(this.data.dest, name), "@import \"color.default.less\";\n@import \"" + colors[colorIndex] + "\";\n@import \"" + styles[styleIndex] + "\";\n");
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['clean', 'jshint', 'qunit', 'uglify', 'multiless', 'recess']);
  grunt.registerTask('server', ['default', 'connect']);

};
