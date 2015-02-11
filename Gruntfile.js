module.exports = function( grunt )
{
    "use strict";

    grunt.initConfig( {

        pkg: grunt.file.readJSON( "package.json" ),

        uglify:
        {
            options:
            {
                mangle: false,
                compress: true,
                banner: "/*! <%= pkg.name %> Copyright Vokal Interactive <%= grunt.template.today( 'yyyy' ) %> */",
                sourceMap: false
            },
            all:
            {
                files:
                {
                    "dist/vokal-ng-api.min.js": [
                        "source/*"
                    ]
                }
            }
        },

        githooks:
        {
            all:
            {
                "pre-commit": "uglify"
            }
        }

    } );

    // Load plugins
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-githooks" );


};
