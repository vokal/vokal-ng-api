module.exports = function( grunt )
{
    "use strict";

    grunt.initConfig( {

        pkg: grunt.file.readJSON( "package.json" ),

        uglify:
        {
            options:
            {
                mangle: true,
                compress: true,
                banner: "/*! <%= pkg.name %> Copyright Vokal <%= grunt.template.today( 'yyyy' ) %> */\n",
                sourceMap: false
            },
            all:
            {
                files:
                {
                    "dist/vokal-ng-api.min.js": [
                        "source/*.*"
                    ]
                }
            }
        }

    } );

    // Load plugins
    grunt.loadNpmTasks( "grunt-contrib-uglify" );

};
