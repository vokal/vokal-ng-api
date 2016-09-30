/* API service */

angular.module( "vokal.API", [ "vokal.Humps" ] )

.factory( "API", [ "$http", "$rootScope", "$q", "$location", "$timeout", "Humps",

    function ( $http, $rootScope, $q, $location, $timeout, Humps )
    {
        "use strict";

        var interrupting = false;
        var resolving    = false;
        var requestQueue = [];
        var promiseQueue = [];
        var flushing     = false;

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
                            var val = angular.isDefined( key_value[ 1 ] ) ?
                                      tryDecodeURIComponent( key_value[ 1 ] ) : true;

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
                .replace( /%24/g,  "$" )
                .replace( /%2C/gi, "," )
                .replace( /%3B/gi, ";" )
                .replace( /%20/g,  "+" )
                .replace( /%7B/g,  "{" )
                .replace( /%7D/g,  "}" )
                .replace( /%5B/g,  "[" )
                .replace( /%5D/g,  "]" )
                .replace( /%22/g,  '"' )
                .replace( /%5C/g,  "\\" );
        }

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
        var queryUrl = function ( path, requestData, options )
        {
            if( !angular.isObject( requestData ) )
            {
                return path;
            }

            requestData = angular.extend( {}, getQueryData( path ), requestData || {} );
            if( options && options.transformHumps )
            {
                requestData = humps.decamelizeKeys( requestData, { separator: "_" } );
            }

            path = path.split( "?" )[ 0 ];

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

        // Matching function for whitelisted routes
        var matcher = function ( routes, route )
        {
            if( angular.isString( routes ) )
            {
                return routes === route;
            }
            else if( angular.isArray( routes ) )
            {
                return routes.indexOf( route ) > -1;
            }
            else
            {
                return false;
            }
        };

        // Define constructor
        var apiConstruct = function ( config )
        {
            this.globalHeaders = angular.copy( this.constructor.prototype.globalHeaders );

            // Initialize parameters
            if( config )
            {
                if( typeof config.name !== "undefined" )
                {
                    this.name = config.name;
                }
                if( typeof config.globalHeaders !== "undefined" )
                {
                    this.globalHeaders = angular.copy( config.globalHeaders );
                }
                if( typeof config.rootPath !== "undefined" )
                {
                    this.rootPath = config.rootPath;
                }
                if( typeof config.keyName !== "undefined" )
                {
                    this.keyName = config.keyName;
                }
                if( typeof config.transformHumps !== "undefined" )
                {
                    this.transformHumps = config.transformHumps;
                }
                if( typeof config.cancelOnRouteChange !== "undefined" )
                {
                    this.cancelOnRouteChange = config.cancelOnRouteChange;
                }
                if( typeof config.unauthorizedInterrupt !== "undefined" )
                {
                    this.unauthorizedInterrupt = config.unauthorizedInterrupt;
                }
                if( typeof config.loginPath !== "undefined" )
                {
                    this.loginPath = config.loginPath;
                }
                if( typeof config.loginRoutes !== "undefined" )
                {
                    this.loginRoutes = config.loginRoutes;
                }
            }

        };

        // Define interface
        apiConstruct.prototype.name                  = "";
        apiConstruct.prototype.globalHeaders         = {};
        apiConstruct.prototype.rootPath              = "";
        apiConstruct.prototype.keyName               = "Authorization";
        apiConstruct.prototype.transformHumps        = true;
        apiConstruct.prototype.cancelOnRouteChange   = false;
        apiConstruct.prototype.unauthorizedInterrupt = true;
        apiConstruct.prototype.loginPath             = null;
        apiConstruct.prototype.loginRoutes           = null;

        apiConstruct.prototype.extendHeaders = function ( headers )
        {
            angular.extend( this.globalHeaders, headers );
        };
        apiConstruct.prototype.setKey = function ( key )
        {
            this.globalHeaders[ this.keyName ] = typeof( key ) === "string" ? key : "";

            if( typeof( key ) !== "string" && typeof( key ) !== "undefined" && key !== null )
            {
                console.warn( "setKey( key ) only accepts a String for parameter key" );
            }
        };
        apiConstruct.prototype.getKey = function ()
        {
            return this.globalHeaders[ this.keyName ];
        };
        apiConstruct.prototype.queryUrl = queryUrl;

        // The driver for API requests
        apiConstruct.prototype.apiRequest = function ( method, path, requestData, repeating )
        {
            var that     = this;
            var defer    = $q.defer();
            var canceler = $q.defer();
            var options  = {
                method:  method,
                url:     this.rootPath + path,
                headers: this.globalHeaders,
                data:    requestData || {},
                timeout: canceler.promise,
                ngName:  this.name
            };

            if( method === "postFile" )
            {
                this.globalHeaders[ "Content-Type" ] = undefined;  // To ensure multipart boundary is added
                options.method                       = "post";
                options.transformRequest             = angular.identity;
            }
            else if( this.transformHumps )
            {
                this.globalHeaders[ "Content-Type" ] = "application/json";
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
                    if( status !== -1 )
                    {
                        $rootScope.$broadcast( "APIRequestComplete", options, data, status );
                    }

                    if( !resolving && status === 401 &&
                        $location.path() !== that.loginPath && !matcher( that.loginRoutes, path ) )
                    {
                        if( !interrupting && !repeating )
                        {
                            // By default, prevent resolutions for unauthorized requests to facilitate clean redirects
                            if( that.unauthorizedInterrupt === true )
                            {
                                $rootScope.$broadcast( "APIRequestUnauthorized", options, data, status );
                                return;
                            }
                            else if( typeof that.unauthorizedInterrupt === "function" )
                            {
                                interrupting = true;

                                requestQueue.push( {
                                    method:      method,
                                    path:        path,
                                    requestData: requestData,
                                    promise:     defer
                                } );
                                promiseQueue.push( defer );

                                $timeout( function ()
                                {
                                    // Disable 401 handling for any requests made during resolution attempt
                                    resolving = true;

                                    // Attempt to resolve authorization issue with user-supplied function
                                    that.unauthorizedInterrupt( data, options, status ).then( function ()
                                    {
                                        // Authorization was resolved, so re-make queued requests without interruption
                                        resolving = false;
                                        flushing  = true;

                                        $q.all( promiseQueue ).finally( function ()
                                        {
                                            flushing     = false;
                                            interrupting = false;
                                            requestQueue = [];
                                            promiseQueue = [];
                                        } );

                                        for( var i = 0; i < requestQueue.length; i++ )
                                        {
                                            that.repeatRequest( requestQueue[ i ] );
                                        }
                                    },
                                    function ( failure )
                                    {
                                        // Authorization was rejected, so broadcast failure event
                                        resolving    = false;
                                        interrupting = false;
                                        requestQueue = [];
                                        promiseQueue = [];
                                        $rootScope.$broadcast( "APIAuthorizationFailure", failure || "", options );
                                    } );

                                }, 0 );

                                return;
                            }
                            else
                            {
                                $rootScope.$broadcast( "APIRequestUnauthorized", options, data, status );
                            }
                        }
                        else
                        {
                            if( repeating )
                            {
                                // If a repeated request still fails with a 401, broadcast the unauthorized event
                                $rootScope.$broadcast( "APIRequestUnauthorized", options, data, status );

                                // Silently cancel repeating requests so APIRequestUnauthorized can be handled
                                for( var i = 0; i < promiseQueue.length; i++ )
                                {
                                    promiseQueue[ i ].promise.$cancel(
                                        "Request canceled due to authorization failure" );
                                }

                                flushing     = false;
                                interrupting = false;
                                requestQueue = [];
                                promiseQueue = [];
                            }
                            else if( flushing )
                            {
                                // If queued requests are already being re-run, re-run this one
                                that.repeatRequest( {
                                    method:      method,
                                    path:        path,
                                    requestData: requestData,
                                    promise:     defer
                                } );
                            }
                            else
                            {
                                // Queue this request while the authorization issue is being resolved
                                requestQueue.push( {
                                    method:      method,
                                    path:        path,
                                    requestData: requestData,
                                    promise:     defer
                                } );
                                promiseQueue.push( defer );
                            }

                            return;
                        }
                    }

                    if( status !== -1 )
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
            if( this.cancelOnRouteChange )
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

            defer.promise.$cancel = function ( message, options, reject )
            {
                canceler.resolve();
                $rootScope.$broadcast( "APIRequestCanceled", options, message );

                if( reject )
                {
                    defer.reject( {
                        data:    message || "Request canceled",
                        options: options
                    } );
                }
            };

            return defer.promise;
        };

        // Provide a method for application code to reset the authorization-resolution state
        apiConstruct.resetAuthResolution = function ()
        {
            interrupting = false;
            resolving    = false;
            requestQueue = [];
            promiseQueue = [];
            flushing     = false;
        };

        // Request aliases
        apiConstruct.prototype.$get = function ( path, requestData )
        {
            return this.apiRequest( "get", queryUrl( path, requestData, { transformHumps: this.transformHumps } ) );
        };
        apiConstruct.prototype.$post = function ( path, requestData )
        {
            return this.apiRequest( "post", path, requestData );
        };
        apiConstruct.prototype.$postFile = function ( path, requestData )
        {
            return this.apiRequest( "postFile", path, requestData );
        };
        apiConstruct.prototype.$put = function ( path, requestData )
        {
            return this.apiRequest( "put", path, requestData );
        };
        apiConstruct.prototype.$patch = function ( path, requestData )
        {
            return this.apiRequest( "patch", path, requestData );
        };
        apiConstruct.prototype.$delete = function ( path )
        {
            return this.apiRequest( "delete", path );
        };

        apiConstruct.prototype.repeatRequest = function ( request )
        {
            this.apiRequest( request.method, request.path, request.requestData, true )

                .then( function ( response )
                {
                    request.promise.resolve( {
                        data:    response.data,
                        options: response.options,
                        status:  response.status
                    } );
                },
                function ( response )
                {
                    request.promise.reject( {
                        data:    response.data,
                        options: response.options,
                        status:  response.status
                    } );
                } );
        };

        return apiConstruct;

    }

] );
