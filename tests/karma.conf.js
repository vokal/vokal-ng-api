module.exports = function ( config )
{
    "use strict";

    config.set( {

        basePath:   "../",
        frameworks: [ "jasmine" ],
        autoWatch:  false,
        browsers:   [ "PhantomJS" ],
        reporters:  [ "dots" ],
        singleRun:  true,
        plugins: [
            "karma-jasmine",
            "karma-phantomjs-launcher"
        ],

        files: [
            "source/components/angular/angular.js",
            "source/components/angular-mocks/angular-mocks.js",
            "source/components/humps/humps.js",

            "services_API.js",
            "services_humps.js",

            "tests/*.spec.js"
        ]

    } );

};
