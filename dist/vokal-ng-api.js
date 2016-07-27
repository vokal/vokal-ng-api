(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define('vokal-ng-api', ["humps"], function (a0) {
      return (factory(a0));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("humps"));
  } else {
    factory(humps);
  }
}(this, function (humps) {

/* API service */

angular.module( "vokal.API", [ "vokal.Humps" ] )

.factory( "API", [ "$http", "$rootScope", "$q", "$location", "Humps",

    function ( $http, $rootScope, $q, $location, Humps )
    {
        "use strict";

        var interrupting = false;
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
            }

        };

        var repeatRequest = function ( request )
        {
            apiConstruct.prototype.apiRequest( request.method, request.path, request.requestData )

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

        // Define interface
        apiConstruct.prototype.name                  = "";
        apiConstruct.prototype.globalHeaders         = {};
        apiConstruct.prototype.rootPath              = "";
        apiConstruct.prototype.transformHumps        = true;
        apiConstruct.prototype.cancelOnRouteChange   = false;
        apiConstruct.prototype.unauthorizedInterrupt = true;
        apiConstruct.prototype.loginPath             = "";

        apiConstruct.prototype.extendHeaders = function ( headers )
        {
            angular.extend( this.globalHeaders, headers );
        };
        apiConstruct.prototype.setKey = function ( key )
        {
            this.globalHeaders.AUTHORIZATION = typeof( key ) === "string" ? key : "";
            if( typeof( key ) !== "string" && typeof( key ) !== "undefined" && key !== null )
            {
                console.warn( "setKey( key ) only accepts a String for parameter key" );
            }
        };
        apiConstruct.prototype.getKey = function ()
        {
            return this.globalHeaders.AUTHORIZATION;
        };

        // To be accessible for tests
        apiConstruct.prototype.queryUrl = queryUrl;

        // The driver for API requests
        apiConstruct.prototype.apiRequest = function ( method, path, requestData )
        {
            var that    = this;
            var defer   = $q.defer();
            var options = {
                method:  method,
                url:     this.rootPath + path,
                headers: this.globalHeaders,
                data:    requestData || {},
                timeout: defer.promise,
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
                    $rootScope.$broadcast( "APIRequestComplete", options, data, status );

                    if( status === 401 && $location.path() !== that.loginPath )
                    {
                        if( !interrupting )
                        {
                            $rootScope.$broadcast( "APIRequestUnauthorized", options, data, status );

                            // By default, prevent resolutions for unauthorized requests to facilitate clean redirects
                            if( that.unauthorizedInterrupt === true )
                            {
                                return;
                            }
                            else if( typeof that.unauthorizedInterrupt === "function" )
                            {
                                interrupting = true;

                                requestQueue.push( {
                                    promise:     defer,
                                    method:      method,
                                    path:        path,
                                    requestData: requestData
                                } );
                                promiseQueue.push( defer );

                                // Attempt to resolve authorization issue with user-supplied function
                                that.unauthorizedInterrupt().then( function ()
                                {
                                    // Authorization was resolved, so re-make queued requests without interruption
                                    flushing = true;

                                    $q.all( promiseQueue ).finally( function ()
                                    {
                                        flushing     = false;
                                        interrupting = false;
                                    } );

                                    for( var i = 0; i < requestQueue.length; i++ )
                                    {
                                        repeatRequest( requestQueue[ i ] );
                                    }
                                },
                                function ( failure )
                                {
                                    // Authorization was rejected, so broadcast failure event
                                    interrupting = false;
                                    $rootScope.$broadcast( "APIAuthorizationFailure", failure || "" );
                                } );

                                return;
                            }
                        }
                        else
                        {
                            if( flushing )
                            {
                                // If queued requests are already being re-run, re-run this one
                                repeatRequest( {
                                    promise:     defer,
                                    method:      method,
                                    path:        path,
                                    requestData: requestData
                                } );
                            }
                            else
                            {
                                // Queue this request while the authorization issue is being resolved
                                requestQueue.push( {
                                    promise:     defer,
                                    method:      method,
                                    path:        path,
                                    requestData: requestData
                                } );
                                promiseQueue.push( defer );
                            }
                        }
                    }

                    $rootScope.$broadcast( "APIRequestError", options, data, status );
                    defer.reject( {
                        data:    data,
                        options: options,
                        status:  status
                    } );

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

        return apiConstruct;

    }

] );

/* Humps service, depends on https://github.com/domchristie/humps/blob/master/humps.js */

angular.module( "vokal.Humps", [] )

.service( "Humps",

    function ()
    {
        "use strict";

        var safeConcat = function ( base, addition )
        {
            base = angular.isArray( base ) ? base : [ base ];
            return base.concat( addition );
        };

        this.responseToCamel = function ( defaultTransforms )
        {
            return ( safeConcat( defaultTransforms, function ( value )
            {
                return humps.camelizeKeys( value );
            } ) );
        };

        this.requestToSnake = function ( defaultTransforms )
        {
            return ( safeConcat( defaultTransforms, function ( value )
            {
                if( typeof( value ) === "string" )
                {
                    return JSON.stringify( humps.decamelizeKeys( JSON.parse( value ), { separator: "_" } ) );
                }

                return humps.decamelizeKeys( value, { separator: "_" } );
            } ) );
        };

    }

);


}));
