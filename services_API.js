/* API service */

angular.module( "vokal.API", [ "vokal.Humps" ] )

.provider( "API", [ "$http", "$rootScope", "$q", "Humps",

    function ( $http, $rootScope, $q, Humps )
    {
        "use strict";

        // Initialize private parameters
        var globalHeaders = {};
        var rootPath      = "";
        var that          = this;

        // App config options
        this.transformHumps        = true;
        this.cancelOnRouteChange   = true;
        this.unauthorizedInterrupt = true;
        this.setHeaders = function ( headers )
        {
            angular.extend( globalHeaders, headers );
        };
        this.setRootPath = function ( path )
        {
            rootPath = String( path );
        };

        // The driver for API requests
        var apiRequest = function ( method, path, requestData )
        {
            var defer   = $q.defer();
            var options = {
                method:  method,
                url:     that.rootPath + path,
                headers: globalHeaders,
                data:    requestData || {},
                timeout: defer.promise
            };

            if( method === "postFile" )
            {
                globalHeaders[ "Content-Type" ] = undefined;  // To ensure multipart boundary is added
                options.method                  = "post";
                options.transformRequest        = angular.identity;
            }
            else if( that.transformHumps )
            {
                options.transformRequest  = Humps.requestToSnake( $http.defaults.transformRequest );
                options.transformResponse = Humps.responseToCamel( $http.defaults.transformResponse );
            }

            $http( options )

                .success( function ( data )
                {
                    $rootScope.$broadcast( "APIRequestComplete", options, data, status );
                    $rootScope.$broadcast( "APIRequestSuccess",  options, data, status );

                    defer.resolve( data );

                } )

                .error( function ( data, status )
                {
                    $rootScope.$broadcast( "APIRequestComplete", options, data, status );

                    if( status === 401 || status === 403 )
                    {
                        $rootScope.$broadcast( "APIRequestUnauthorized", options, data, status );

                        // By default, prevent resolutions for unauthorized requests to facilitate clean redirects
                        if( !that.unauthorizedInterrupt )
                        {
                            $rootScope.$broadcast( "APIRequestError", options, data, status );
                            defer.reject( data, status );
                        }
                    }
                    else
                    {
                        $rootScope.$broadcast( "APIRequestError", options, data, status );
                        defer.reject( data, status );
                    }

                } );

            $rootScope.broadcast( "APIRequestStart", options );

            // By default, cancel this API call if the application route is changed before it resolves
            if( that.cancelOnRouteChange )
            {
                var routeMonitor = $rootScope.$on( "$routeChangeSuccess", function ()
                {
                    defer.promise.$cancel( "Request canceled", options );
                    routeMonitor();
                } );

                var removeRouteMonitor = $rootScope.$on( "APIRequestComplete", function ()
                {
                    routeMonitor();
                    removeRouteMonitor();
                } );
            }

            defer.promise.$cancel = function ( message, options )
            {
                defer.reject( message || "Request cancelled", options );
            };

            return defer.promise;
        };

        // Interface methods
        this.$get = function ()
        {
            return {
                setKey: function ( key )
                {
                    globalHeaders.AUTHORIZATION = String( key );
                },
                getKey: function ()
                {
                    return globalHeaders.AUTHORIZATION;
                },
                $get:      function ( path ) {              return apiRequest( "get",      path ); },
                $post:     function ( path, requestData ) { return apiRequest( "post",     path, requestData ); },
                $postFile: function ( path, requestData ) { return apiRequest( "postFile", path, requestData ); },
                $put:      function ( path, requestData ) { return apiRequest( "put",      path, requestData ); },
                $patch:    function ( path, requestData ) { return apiRequest( "patch",    path, requestData ); },
                $delete:   function ( path ) {              return apiRequest( "delete",   path ); }
            };
        };

    }

] );
