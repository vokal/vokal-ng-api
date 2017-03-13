describe( "API with Humps", function ()
{
    "use strict";

    var API;
    var url        = "/api/endpoint";
    var authUrl    = "/api/auth/error";
    var humpsUrl   = "/humps";
    var noHumpsUrl = "/no-humps";
    var $httpBackend;
    var $rootScope;
    var $timeout;
    var $q;

    beforeEach( module( "vokal.API" ) );
    beforeEach( inject( function ( $injector )
    {
        API          = $injector.get( "API" );
        $httpBackend = $injector.get( "$httpBackend" );
        $rootScope   = $injector.get( "$rootScope" );
        $timeout     = $injector.get( "$timeout" );
        $q           = $injector.get( "$q" );

        $httpBackend.when( "GET", url ).respond( "Value" );
        $httpBackend.when( "POST", url ).respond( "Success" );

        $httpBackend.when( "GET", authUrl )

            .respond( function ( method, url, data, headers )
            {
                if( headers.Authorization === "bad" )
                {
                    return [
                        401,
                        { error: "unauthorized" },
                        {}
                    ];
                }
                else if( headers.Authorization === "good" )
                {
                    return [
                        200,
                        "success",
                        {}
                    ];
                }
                else
                {
                    return [
                        400,
                        "failure",
                        {}
                    ];
                }
            } );

        $httpBackend.when( "POST", humpsUrl )

            .respond( function ( method, url, data )
            {
                var obj = angular.fromJson( data );

                return [
                    201,
                    { some_value: obj.some_value },
                    {}
                ];
            } );

        $httpBackend.when( "POST", noHumpsUrl )

            .respond( function ( method, url, data )
            {
                var obj = angular.fromJson( data );

                return [
                    201,
                    { someValue: obj.someValue },
                    {}
                ];
            } );

    } ) );

    it( "should always return a promise", function ()
    {
        var testAPI = new API();

        $httpBackend.expectGET( url );
        expect( testAPI.$get( url ).then ).toBeDefined();
        $httpBackend.flush();

        $httpBackend.expectPOST( url );
        expect( testAPI.$post( url, { data: "value" } ).then ).toBeDefined();
        $httpBackend.flush();
    } );

    it( "should abort silently when $cancel is called", function ()
    {
        var promise;
        var flag;

        $httpBackend.expectGET( url );
        promise = ( new API() ).$get( url );
        promise.then( function ()
        {
            flag = "Resolve";
        },
        function ()
        {
            flag = "Reject";
        } );

        promise.$cancel();

        $timeout( function ()
        {
            expect( flag ).toBe( undefined );
        }, 100 );

        $timeout.flush();

    } );

    it( "should reject when $cancel is called with the reject flag", function ()
    {
        var promise;
        var flag;

        $httpBackend.expectGET( url );
        promise = ( new API() ).$get( url );
        promise.then( function ()
        {
            flag = "Incorrect";
        },
        function ( obj )
        {
            flag = obj.data;
        } );

        promise.$cancel( "Denied", {}, true );

        $timeout( function ()
        {
            expect( flag ).toBe( "Denied" );
        }, 100 );

        $timeout.flush();

    } );

    it( "should not $cancel already received data", function ()
    {
        var promise;
        var flag;

        $httpBackend.expectPOST( url );
        promise = ( new API() ).$post( url );
        promise.then( function ( obj )
        {
            flag = obj.data;
        },
        function ()
        {
            flag = "Incorrect";
        } );

        // $cancel is called after the backend flush()
        $httpBackend.flush();
        promise.$cancel();

        expect( flag ).toBe( "Success" );
    } );

    it( "should transform POST requests", function ()
    {
        var result;
        var testAPI = new API();

        testAPI.$post( humpsUrl, { someValue: "value" } )

            .then( function ( obj )
            {
                result = obj.data;
            } );

        $httpBackend.flush();

        expect( result.someValue ).toBeDefined();
        expect( result.some_value ).toBeUndefined();
    } );

    it( "should create distinct instances", function ()
    {
        var Test1 = new API();
        Test1.setKey( "key1" );

        var Test2 = new API();
        Test2.setKey( "key2" );
        Test2.rootPath = "testPath";

        expect( Test1.getKey() ).toBe( "key1" );
        expect( Test2.getKey() ).toBe( "key2" );

        expect( Test1.rootPath ).toBe( "" );
        expect( Test2.rootPath ).toBe( "testPath" );
    } );

    it( "should expose the name to event listeners", function ()
    {
        var result;
        var testAPI = new API( {
            name: "testName"
        } );

        $rootScope.$on( "APIRequestStart", function ( event, options )
        {
            result = options.ngName;
        } );

        testAPI.$post( url, { someValue: "value" } );

        $httpBackend.flush();
        expect( result ).toBe( "testName" );
    } );

    it( "should allow resolution of authorization issues", function ()
    {
        var result;
        var testAPI = new API( {
            unauthorizedInterrupt: function ()
            {
                var deferred = $q.defer();
                testAPI.setKey( "good" );
                deferred.resolve();
                return deferred.promise;
            }
        } );

        testAPI.setKey( "bad" );

        testAPI.$get( authUrl ).then( function ( response )
        {
            result = response.data;
        } );

        $httpBackend.flush();
        $timeout.flush();
        $httpBackend.flush();
        $timeout.flush();
        expect( result ).toBe( "success" );
    } );

    it( "should broadcast when a supposedly resolved authorization issue still fails", function ()
    {
        var result;
        var testAPI = new API( {
            unauthorizedInterrupt: function ()
            {
                var deferred = $q.defer();
                testAPI.setKey( "bad" );
                deferred.resolve();
                return deferred.promise;
            }
        } );

        testAPI.setKey( "bad" );
        testAPI.$get( authUrl );

        $rootScope.$on( "APIRequestUnauthorized", function ()
        {
            result = "failure";
        } );

        $httpBackend.flush();
        $timeout.flush();
        $httpBackend.flush();
        $timeout.flush();
        expect( result ).toBe( "failure" );
    } );

    it( "should broadcast on a failed attempt to resolve an authorization issue", function ()
    {
        var result;
        var testAPI = new API( {
            unauthorizedInterrupt: function ( data )
            {
                var deferred = $q.defer();
                testAPI.$get( authUrl ).catch( function ()  // This 401 should go unresolved, just error-handled
                {
                    deferred.reject( data.error );
                } );
                return deferred.promise;
            }
        } );

        testAPI.setKey( "bad" );
        testAPI.$get( authUrl );

        $rootScope.$on( "APIAuthorizationFailure", function ( event, message )
        {
            result = message;
        } );

        $httpBackend.flush();
        $timeout.flush();
        $httpBackend.flush();
        expect( result ).toBe( "unauthorized" );
    } );

    it( "should not run authentication functions on a whitelisted route", function ()
    {
        var resultOne = "unset";
        var resultTwo = "unset";
        var testAPI = new API( {
            unauthorizedInterrupt: function ( data )
            {
                resultOne = "set";
                var deferred = $q.defer();
                deferred.reject( data.error );
                return deferred.promise;
            },
            loginRoutes: [ "test", authUrl ]
        } );

        testAPI.setKey( "bad" );
        testAPI.$get( authUrl ).catch( function () {} ); // As of Angular 1.6 all rejections must be handled

        $rootScope.$on( "APIAuthorizationFailure", function ( event, message )
        {
            resultTwo = message;
        } );

        $httpBackend.flush();
        $timeout.flush();
        expect( resultOne ).toBe( "unset" );
        expect( resultTwo ).toBe( "unset" );
    } );

    it( "should only allow keys to be a string", function ()
    {
        var Test1 = new API();
        Test1.setKey( "1" );
        expect( Test1.getKey() ).toBe( "1" );

        Test1.setKey( null );
        expect( Test1.getKey() ).toBe( "" );

        Test1.setKey( undefined );
        expect( Test1.getKey() ).toBe( "" );

        Test1.setKey( {} );
        expect( Test1.getKey() ).toBe( "" );

        Test1.setKey( 1 );
        expect( Test1.getKey() ).toBe( "" );
    } );

    it( "should have defaults", function ()
    {
        var testAPI = new API();

        expect( testAPI.getKey() ).toBeUndefined();
        expect( testAPI.name ).toBe( "" );
        expect( testAPI.rootPath ).toBe( "" );
        expect( testAPI.keyName ).toBe( "Authorization" );
        expect( testAPI.transformHumps ).toBe( true );
        expect( testAPI.cancelOnRouteChange ).toBe( false );
        expect( testAPI.unauthorizedInterrupt ).toBe( false );
        expect( testAPI.loginPath ).toBe( null );
        expect( testAPI.loginRoutes ).toBe( null );
    } );

    it( "should be configurable at instantiation", function ()
    {
        var testAPI = new API( {
            name: "testAPI",
            globalHeaders: { AuthToken: "theKey", CustomHeader: "custom" },
            rootPath: "/api/v1/",
            keyName: "AuthToken",
            transformHumps: false,
            cancelOnRouteChange: true,
            unauthorizedInterrupt: false,
            loginPath: "/login",
            loginRoutes: "login",
            customField: "lala"
        } );

        expect( testAPI.name ).toBe( "testAPI" );
        expect( testAPI.getKey() ).toBe( "theKey" );
        expect( testAPI.globalHeaders.CustomHeader ).toBe( "custom" );
        expect( testAPI.rootPath ).toBe( "/api/v1/" );
        expect( testAPI.keyName ).toBe( "AuthToken" );
        expect( testAPI.transformHumps ).toBe( false );
        expect( testAPI.cancelOnRouteChange ).toBe( true );
        expect( testAPI.unauthorizedInterrupt ).toBe( false );
        expect( testAPI.loginPath ).toBe( "/login" );
        expect( testAPI.loginRoutes ).toBe( "login" );
        expect( testAPI.customField ).toBeUndefined();
    } );

    it( "should allow the headers to be extended", function ()
    {
        var testAPI = new API();

        testAPI.setKey( "theKey" );
        testAPI.extendHeaders( { CustomHeader: "custom" } );

        expect( testAPI.getKey() ).toBe( "theKey" );
        expect( testAPI.globalHeaders.CustomHeader ).toBe( "custom" );
    } );

    it( "should create querystrings", function ()
    {
        var testAPI = new API();

        expect( testAPI.queryUrl( "/the/path/" ) )
            .toEqual( "/the/path/" );

        expect( testAPI.queryUrl( "/the/path/?key=value" ) )
            .toEqual( "/the/path/?key=value" );

        expect( testAPI.queryUrl( "/the/path/", { key1: "1", key2: "2" } ) )
            .toEqual( "/the/path/?key1=1&key2=2" );

        expect( testAPI.queryUrl( "/the/path/", { key1: { key2: 2 } } ) )
            .toEqual( "/the/path/?key1={\"key2\":2}" );

        expect( testAPI.queryUrl( "/the/path/?key1={\"key2\":2}", { key1: 1 } ) )
            .toEqual( "/the/path/?key1=1" );

        expect( testAPI.queryUrl( "/the/path/?key=1", { key: "value" } ) )
            .toEqual( "/the/path/?key=value" );

        expect( testAPI.queryUrl( "/the/path/", { key: [ 1, "'", '"', "&", "=", "?", false ] } ) )
            .toEqual( "/the/path/?key=[1,\"'\",\"\\\"\",\"%26\",\"%3D\",\"%3F\",false]" );

        expect( testAPI.queryUrl( "/the/path/?someValue=a", { anotherValue: 1 }, { transformHumps: true } ) )
            .toEqual( "/the/path/?some_value=a&another_value=1" );
    } );


    afterEach( function ()
    {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    } );

} );
