module.exports = function ( config )
{
    "use strict";

    config.set( {

        basePath:   "../",
        frameworks: [ "jasmine" ],
        autoWatch:  false,
        browsers:   [ "PhantomJS" ],
        reporters:  [ "dots", "coverage" ],
        singleRun:  true,
        plugins: [
            "karma-jasmine",
            "karma-phantomjs-launcher",
            "karma-coverage"
        ],
        preprocessors: {
            "source/services-API.js": [ "coverage" ],
            "source/services-humps.js": [ "coverage" ]
        },
        coverageReporter: {
            dir : "coverage/",
            reporters: [
                { type: "cobertura", subdir: ".", file: "cobertura.xml" }
            ]
        },
        files: [
            "node_modules/angular/angular.js",
            "node_modules/angular-mocks/angular-mocks.js",
            "node_modules/humps/humps.js",

            "source/services-API.js",
            "source/services-humps.js",

            "tests/*.spec.js"
        ]

    } );

};
