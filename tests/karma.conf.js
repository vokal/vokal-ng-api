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
            "services_API.js": [ "coverage" ],
            "services_humps.js": [ "coverage" ]
        },
        coverageReporter: {
            dir : "coverage/",
            reporters: [
                { type: 'cobertura', subdir: '.', file: 'cobertura.xml' },
            ]
        },
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
