// Check for and attach token on all API requests
angular.module( "vokal.API", [ "vokal.Humps" ] )

.factory( "API", [ "$http", "$rootScope", "$location", "$q", "Humps",

    function ( $http, $rootScope, $location, $q, Humps )
    {
        "use strict";

        var apiRequest = function( method, path, requestData )
        {
            var headers = { "AUTHORIZATION": "Token " + $rootScope.authToken };
            var options = {
                method: method,
                url: path,
                headers: headers,
                data: requestData || {},
                transformRequest: Humps.requestToSnake( $http.defaults.transformResponse ),
                transformResponse: Humps.responseToCamel( $http.defaults.transformResponse )
            };

            if( method === "postFile" )
            {
                headers[ "Content-Type" ] = undefined;  // To ensure multipart boundary is added
                options.method            = "post";
                options.headers           = headers;
                options.transformRequest  = angular.identity;
            }

            var callbacks   = {};
            var canceler    = $q.defer();
            options.timeout = canceler.promise;

            $http( options ).success( function ( data, status, headers, config )
            {
                if( callbacks.success ) { callbacks.success( data, status, headers, config ); }

            } ).error( function ( data, status, headers, config )
            {
                if( status === 401 || status === 403 )
                {
                    var loginPath = "/login/";

                    if( $location.path() !== loginPath )
                    {
                        $location.path( loginPath );
                        return;
                    }
                }

                if( callbacks.error ) { callbacks.error( data, status, headers, config ); }

            } );

            var methods = {

                $cancel: function ()
                {
                    canceler.resolve( "Request canceled" );
                },
                success: function ( callback )
                {
                    callbacks.success = callback;
                    return methods;
                },
                error: function ( callback )
                {
                    callbacks.error = callback;
                    return methods;
                }
            };

            return methods;
        };

        return {
            $get:      function( path ) {              return apiRequest( "get", path, {} ); },
            $post:     function( path, requestData ) { return apiRequest( "post", path, requestData ); },
            $postFile: function( path, requestData ) { return apiRequest( "postFile", path, requestData ); },
            $put:      function( path, requestData ) { return apiRequest( "put", path, requestData ); },
            $patch:    function( path, requestData ) { return apiRequest( "patch", path, requestData ); },
            $delete:   function( path ) {              return apiRequest( "delete", path, {} ); }
        };

    }

] );