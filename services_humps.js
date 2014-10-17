"use strict";

/* Humps Service, depends on https://github.com/domchristie/humps/blob/master/humps.js */
angular.module( "vokal.Humps", [] )

.factory( "Humps",
    function ()
    {
        "use strict";

        var safeConcat = function ( base, addition )
        {
            base = angular.isArray( base ) ? base : [base];
            return ( base.concat( addition ) );
        };

        var responseToCamel = function( defaultTransforms )
        {
            return ( safeConcat( defaultTransforms, function( value )
            {
              return humps.camelizeKeys( value );
            } ) );
        };

        var requestToSnake = function( defaultTransforms )
        {
            return ( safeConcat( defaultTransforms, function( value )
            {
                return JSON.stringify( humps.decamelizeKeys( value, "_" ) );
            } ) );
        };

        return {
            responseToCamel: function( defaultTransforms ) { return responseToCamel( defaultTransforms ); },
            requestToSnake: function( defaultTransforms ) { return requestToSnake( defaultTransforms ); }
        };

    }

);