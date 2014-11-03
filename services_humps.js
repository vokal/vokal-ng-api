/* Humps service, depends on https://github.com/domchristie/humps/blob/master/humps.js */

angular.module( "vokal.Humps", [] )

.service( "Humps",

    function ()
    {
        "use strict";

        var safeConcat = function ( base, addition )
        {
            base = angular.isArray( base ) ? base : [ base ];
            return ( base.concat( addition ) );
        };

        this.responseToCamel = function ( defaultTransforms )
        {
            return ( safeConcat( defaultTransforms, function( value )
            {
                return humps.camelizeKeys( value );

            } ) );
        };

        this.requestToSnake = function ( defaultTransforms )
        {
            return ( safeConcat( defaultTransforms, function( value )
            {
                return JSON.stringify( humps.decamelizeKeys( value, "_" ) );

            } ) );
        };

    }

);
