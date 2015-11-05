describe( "API with Humps", function ()
{
    "use strict";

    var API;
    var url        = "/api/endpoint";
    var humpsUrl   = "/humps";
    var noHumpsUrl = "/no-humps";
    var $httpBackend;

    beforeEach( module( "vokal.API" ) );
    beforeEach( inject( function ( $injector )
    {
        API          = $injector.get( "API" );
        $httpBackend = $injector.get( "$httpBackend" );

        $httpBackend.when( "GET", url ).respond( "Value" );
        $httpBackend.when( "POST", url ).respond( "Success" );

        $httpBackend.when( "POST", humpsUrl )

            .respond( function ( method, url, data )
            {
                var obj = angular.fromJson ( data );

                return [
                    201,
                    { some_value: obj.some_value },
                    {}
                ];
            } );

        $httpBackend.when( "POST", noHumpsUrl )

            .respond( function ( method, url, data )
            {
                var obj = angular.fromJson ( data );

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

    it( "should return a $cancel option on the promise", function ()
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

        expect( promise.$cancel ).toBeDefined();

        // $cancel is called before the backend flush()
        promise.$cancel( "Denied" );
        $httpBackend.flush();

        expect( flag ).toBe( "Denied" );
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

    it( "should have defaults", function ()
    {
        var testAPI = new API();

        expect( testAPI.getKey() ).toBeUndefined();
        expect( testAPI.rootPath ).toBe( "" );
        expect( testAPI.transformHumps ).toBe( true );
        expect( testAPI.cancelOnRouteChange ).toBe( false );
        expect( testAPI.unauthorizedInterrupt ).toBe( true );

    } );

    it( "should be configurable at instantiation", function ()
    {
        var testAPI = new API( {
            globalHeaders: { AUTHORIZATION: "theKey", customHeader: "custom" },
            rootPath: "/api/v1/",
            transformHumps: false,
            cancelOnRouteChange: true,
            unauthorizedInterrupt: false,
            customField: "lala"
        } );

        expect( testAPI.getKey() ).toBe( "theKey" );
        expect( testAPI.globalHeaders.customHeader ).toBe( "custom" );
        expect( testAPI.rootPath ).toBe( "/api/v1/" );
        expect( testAPI.transformHumps ).toBe( false );
        expect( testAPI.cancelOnRouteChange ).toBe( true );
        expect( testAPI.unauthorizedInterrupt ).toBe( false );
        expect( testAPI.customField ).toBeUndefined();

    } );

    it( "should allow the headers to be extended", function ()
    {
        var testAPI = new API();

        testAPI.setKey( "theKey" );
        testAPI.extendHeaders( { customHeader: "custom" } );

        expect( testAPI.getKey() ).toBe( "theKey" );
        expect( testAPI.globalHeaders.customHeader ).toBe( "custom" );

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
