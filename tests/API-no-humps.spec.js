describe( "API without Humps", function ()
{
    "use strict";

    var API;
    var noHumpsUrl = "/no-humps";
    var $httpBackend;

    beforeEach( function ()
    {
        module( "vokal.API" );

        inject( function ( $injector )
        {
            API          = $injector.get( "API" );
            $httpBackend = $injector.get( "$httpBackend" );

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

        } );

    } );

    it( "should not transform requests", function ()
    {
        var result;
        var testAPI = new API( { transformHumps: false } );

        testAPI.$post( noHumpsUrl, { someValue: "value" } )

            .then( function ( obj )
            {
                result = obj.data;
            } );

        $httpBackend.flush();

        expect( result.someValue ).toBeDefined();
        expect( result.some_value ).toBeUndefined();
    } );

    it( "should create querystrings", function ()
    {
        var testAPI = new API();

        expect( testAPI.queryUrl( "/the/path/?someValue=a", { anotherValue: 1 } ) )
            .toEqual( "/the/path/?someValue=a&anotherValue=1", { transformHumps: false } );
    } );

    afterEach( function ()
    {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    } );

} );
