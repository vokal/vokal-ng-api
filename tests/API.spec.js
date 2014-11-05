describe( "API", function ()
{
    "use strict";

    var API;
    var url = "/api/endpoint";
    var humpsUrl = "/humps";
    var noHumpsUrl = "/no-humps"
    var $httpBackend;

    beforeEach( module( "vokal.API" ) );
    beforeEach( inject( function ( $injector )
    {
        API = $injector.get( "API" );
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
        $httpBackend.expectGET( url );
        expect( API.$get( url ).then ).toBeDefined();
        $httpBackend.flush();

        $httpBackend.expectPOST( url );
        expect( API.$post( url, { data: "value" } ).then ).toBeDefined();
        $httpBackend.flush();
    } );

    it( "should return a $cancel option on the promise", function ()
    {
        var promise;
        var flag;

        $httpBackend.expectGET( url );
        promise = API.$get( url );
        promise.then( function ()
        {
            flag = "Incorrect";
        },
        function ( val )
        {
            flag = val;
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
        promise = API.$post( url );
        promise.then( function ( val )
        {
            flag = val;
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

    it( "should work with Humps", function ()
    {
        var result;

        API.$post( humpsUrl, { someValue: "value" } )
        .then( function ( data )
        {
            result = data;
        } );

        $httpBackend.flush();

        expect( result.someValue ).toBeDefined();
        expect( result.some_value ).toBeUndefined();
    } );

    /*
    // requires turning off humps, need fake module http://stackoverflow.com/questions/14771810/how-to-test-angularjs-custom-provider
    it( "should work without Humps", function ()
    {
        var result;

        API.$post( noHumpsUrl, { someValue: "value" } )
        .then( function ( data )
        {
            result = data;
        } );

        $httpBackend.flush();

        expect( result.someValue ).toBeDefined();
        expect( result.some_value ).toBeUndefined();
    } );
    */
    afterEach( function ()
    {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    } );

} );
