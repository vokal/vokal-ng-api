// Check for and attach token on all API requests
angular.module( "vokal.API", [ "vokal.Humps" ] )

.factory( "API", [ "$http", "$rootScope", "$location", "$q", "Humps",

    function ( $http, $rootScope, $location, $q, Humps )
    {
        "use strict";

        var apiRequest = function( method, path, requestData )
        {
            var defer = $q.defer();
            var headers = { "AUTHORIZATION": "Token " + $rootScope.authToken };
            var options = {
                method: method,
                url: path,
                headers: headers,
                data: requestData || {},
                transformRequest: Humps.requestToSnake( $http.defaults.transformResponse ),
                transformResponse: Humps.responseToCamel( $http.defaults.transformResponse ),
                timeout: defer.promise
            };

            if( method === "postFile" )
            {
                headers[ "Content-Type" ] = undefined;  // To ensure multipart boundary is added
                options.method            = "post";
                options.headers           = headers;
                options.transformRequest  = angular.identity;
            }

            $http( options ).success( function ( data, status, headers, config )
            {
                defer.resolve( data );
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
                defer.reject( data );
                
            } );

            return defer.promise;
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