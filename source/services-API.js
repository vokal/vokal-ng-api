/* API service */

angular.module( "vokal.API", [ "vokal.Humps" ] )

.provider( "API", function ()
{
    "use strict";

    // Initialize private parameters
    var globalHeaders = {};
    var rootPath      = "";
    var that          = this;

    // App config options
    this.transformHumps        = true;
    this.cancelOnRouteChange   = false;
    this.unauthorizedInterrupt = true;
    this.setHeaders = function ( headers )
    {
        angular.extend( globalHeaders, headers );
    };
    this.setRootPath = function ( path )
    {
        rootPath = String( path );
    };

    // ** Function copied from private angular.js source
    function tryDecodeURIComponent( value )
    {
        try
        {
            return decodeURIComponent( value );
        }
        catch( e )
        {
            // Ignore any invalid URI component
        }
    }

    // ** Function copied from private angular.js source
    function parseKeyValue( keyValue )
    {
        var obj = {}, key_value, key;

        angular.forEach( ( keyValue || "" ).split( "&" ),

            function ( keyValue )
            {
                if( keyValue )
                {
                    key_value = keyValue.replace( /\+/g, "%20" ).split( "=" );
                    key       = tryDecodeURIComponent( key_value[ 0 ] );

                    if( angular.isDefined( key ) )
                    {
                        var val = angular.isDefined( key_value[ 1 ] ) ? tryDecodeURIComponent( key_value[ 1 ] ) : true;

                        if( !hasOwnProperty.call( obj, key ) )
                        {
                            obj[ key ] = val;
                        }
                        else if( angular.isArray( obj[ key ] ) )
                        {
                            obj[ key ].push( val );
                        }
                        else
                        {
                            obj[ key ] = [ obj[ key ], val ];
                        }
                    }
                }
            }

        );
        return obj;
    }

    // Based on function from private angular.js source
    function encodeUriQuery( val )
    {
        return encodeURIComponent( val )
            .replace( /%40/gi, "@" )
            .replace( /%3A/gi, ":" )
            .replace( /%24/g, "$" )
            .replace( /%2C/gi, "," )
            .replace( /%3B/gi, ";" )
            .replace( /%20/g, "+" )
            .replace( /%7B/g, "{" )
            .replace( /%7D/g, "}" )
            .replace( /%5B/g, "[" )
            .replace( /%5D/g, "]" )
            .replace( /%22/g, '"' )
            .replace( /%5C/g, "\\" );
    }

    this.$get = [ "$http", "$rootScope", "$q", "Humps", function ( $http, $rootScope, $q, Humps )
    {
        // The driver for API requests
        var apiRequest = function ( method, path, requestData )
        {
            var defer   = $q.defer();
            var options = {
                method:  method,
                url:     rootPath + path,
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
                globalHeaders[ "Content-Type" ] = "application/json";
                options.transformRequest  = Humps.requestToSnake( $http.defaults.transformRequest );
                options.transformResponse = Humps.responseToCamel( $http.defaults.transformResponse );
            }

            $http( options )

                .success( function ( data, status )
                {
                    $rootScope.$broadcast( "APIRequestComplete", options, data, status );
                    $rootScope.$broadcast( "APIRequestSuccess",  options, data, status );

                    defer.resolve( { 
                        data:    data,
                        options: options,
                        status:  status
                    } );

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
                            defer.reject( { 
                                data:    data,
                                options: options,
                                status:  status
                            } );
                        }
                    }
                    else
                    {
                        $rootScope.$broadcast( "APIRequestError", options, data, status );
                        defer.reject( { 
                            data:    data,
                            options: options,
                            status:  status
                        } );
                    }

                } );

            $rootScope.$broadcast( "APIRequestStart", options );

            // If enabled, cancel this API call if the application route is changed before it resolves
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
                $rootScope.$broadcast( "APIRequestCanceled", options, message );
                defer.reject( { 
                    data:    message || "Request cancelled",
                    options: options
                } );
            };

            return defer.promise;
        };

        // Parse URL query string data into object
        var getQueryData = function ( path )
        {
            var pathAndQuery = path.split( "?" );

            if( pathAndQuery.length === 1 )
            {
                return {};
            }

            return parseKeyValue( pathAndQuery[ 1 ] );
        };

        // Build a URL query string based on an object
        var queryUrl = function ( path, requestData )
        {
            if( !angular.isObject( requestData ) )
            {
                return path;
            }

            requestData = angular.extend( {}, getQueryData( path ), requestData || {} );
            path        = path.split( "?" )[ 0 ];

            var keys       = Object.keys( requestData );
            var queryParts = [];

            for( var k = 0; k < keys.length; k++ )
            {
                var key   = keys[ k ];
                var value = requestData[ key ];

                if( angular.isObject( value ) )
                {
                    value = JSON.stringify( value );
                }

                queryParts.push( encodeUriQuery( key ) + "=" + encodeUriQuery( value ) );
            }

            return path + ( queryParts.length ? "?" + queryParts.join( "&" ) : "" );
        };

        // Interface methods
        return {
            setKey: function ( key )
            {
                globalHeaders.AUTHORIZATION = String( key );
            },
            getKey: function ()
            {
                return globalHeaders.AUTHORIZATION;
            },
            queryUrl:  queryUrl,
            $get:      function ( path, requestData ) { return apiRequest( "get",      queryUrl( path, requestData ) ); },
            $post:     function ( path, requestData ) { return apiRequest( "post",     path, requestData ); },
            $postFile: function ( path, requestData ) { return apiRequest( "postFile", path, requestData ); },
            $put:      function ( path, requestData ) { return apiRequest( "put",      path, requestData ); },
            $patch:    function ( path, requestData ) { return apiRequest( "patch",    path, requestData ); },
            $delete:   function ( path ) {              return apiRequest( "delete",   path ); }
        };

    } ];

} );
