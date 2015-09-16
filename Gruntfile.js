module.exports = function ( grunt )
{
    "use strict";

    grunt.initConfig( {

        pkg: grunt.file.readJSON( "package.json" ),

        concat:
        {
            dist:
            {
                files:
                {
                    "dist/<%= pkg.name %>.js": [
                        "source/*.*"
                    ]
                }
            }
        },

        umd: {
            dist: {
                options: {
                    src: "dist/<%= pkg.name %>.js",
                    amdModuleId: "<%= pkg.name %>",
                    deps: {
                        "default": [ "humps" ]
                    }
                }
            }
        },

        uglify:
        {
            options:
            {
                mangle: true,
                compress: {},
                banner: "/*! <%= pkg.name %> Copyright Vokal <%= grunt.template.today( 'yyyy' ) %> */\n",
                sourceMap: false
            },
            dist:
            {
                files:
                {
                    "dist/<%= pkg.name %>.min.js": [
                        "dist/<%= pkg.name %>.js"
                    ]
                }
            }
        }

    } );

    // Load plugins
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-concat" );
    grunt.loadNpmTasks( "grunt-umd" );

    grunt.registerTask( "default", [ "concat", "umd", "uglify" ] );

};
