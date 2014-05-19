module.exports = function( grunt ) {
  
  var 

  DOCS_OUT = 'docs',
  DOCS_IN = [
    'README.md',
    'src/paraload.js'
  ];

  grunt.initConfig( {

    clean: {
      docs: {
        src: DOCS_OUT,
      }
    },

    docker: {
      app: {
        expand: true,
        src: DOCS_IN,
        dest: DOCS_OUT,
        options: {
          onlyUpdated: false,
          colourScheme: 'tango',

          // 'autumn'
          // 'borland'
          // 'bw'
          // 'colorful'
          // 'default'
          // 'emacs'
          // 'friendly'
          // 'fruity'
          // 'manni'
          // 'monokai'
          // 'murphy'
          // 'native'
          // 'pastie'
          // 'perldoc'
          // 'rrt'
          // 'tango'
          // 'trac'
          // 'vim'
          // 'vs'


          ignoreHidden: false,
          sidebarState: true,
          exclude: [],
          lineNums: true,
          js: [],
          css: [],
          extras: ['goToLine', 'fileSearch']
        }
      }
    },

    uglify: {
      options: {
        // beautify: true,
        preserveComments: 'some',
        compress: {
          global_defs: {
            "DEBUG": false
          },
          dead_code: true
        }
      },
      all: {
        files: {
          'dist/paraload.min.js': ['lib/whif/src/whif.js', 'src/paraload.js']
        }
      }
    }

  } );

  // task libs
  [
    'grunt-contrib-clean',
    'grunt-contrib-uglify',
    'grunt-docker',
  ].forEach( grunt.loadNpmTasks, grunt );

  // task definitions
  grunt.registerTask( 'build:docs', [
    'clean:docs',
    'docker'
  ]);

  grunt.registerTask( 'build', [
    'build:docs',
    'uglify'
  ]);
}