describe( "API without Humps", function ()
{
    "use strict";

    var API;
    var noHumpsUrl = "/no-humps";
    var $httpBackend;

    beforeEach( function ()
    {
        var mockModule = angular.module( "test.vokal.API", function () {} );
        mockModule.config( function ( APIProvider )
        {
            APIProvider.transformHumps = false;
        } );

        module( "vokal.API", "test.vokal.API" );

        inject( function ( $injector )
        {
            API          = $injector.get( "API" );
            $httpBackend = $injector.get( "$httpBackend" );

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

        } );

    } );

    it( "should not transform requests", function ()
    {
        var result;

        API.$post( noHumpsUrl, { someValue: "value" } )

            .then( function ( obj )
            {
                result = obj.data;
            } );

        $httpBackend.flush();

        expect( result.someValue ).toBeDefined();
        expect( result.some_value ).toBeUndefined();
    } );

    afterEach( function ()
    {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    } );

} );
