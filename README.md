# vokal-ng-api

Vokal's common Angular API service. Wraps Angular's `$http` service.

> Maintained by @Tathanen

* [Configuration & Usage](#section-config-usage)
* [HTTP Interface](#section-interface)
* [Events](#section-events)


## <a id="section-config-usage"></a>Configuration & Usage

The `API` service returns a constructor function that can be used to instantiate a helper for an HTTP API.

```javascript
var Facebook = new API();
```

The service can be configured by setting individual properties, or by passing an optional configuration object at instantiation.

```javascript
var Facebook = new API();
Facebook.rootPath = "https://graph.facebook.com/";
Facebook.transformHumps = false;
Facebook.setKey( token );
```

```javascript
var Facebook = new API( {
    rootPath: "https://graph.facebook.com/",
    transformHumps: false,
    globalHeaders: { AUTHORIZATION: token }
} );
```

You can instantiate the service on the fly for single usage, but the recommended pattern is to create a dedicated service that returns a pre-configured instance.

```javascript
angular.module( "vokal.Facebook", [ "vokal.API" ] )

.factory( "Facebook", [ "API",

    function ( API )
    {
        "use strict";

        var Facebook = new API( {
            rootPath: "https://graph.facebook.com/",
            transformHumps: false,
            globalHeaders: { AUTHORIZATION: token }
        } );

        return Facebook;

    }

] );
```

The following properties can be set directly or via the constructor config object:

* [name](#prop-name)
* [globalHeaders](#prop-globalHeaders)
* [rootPath](#prop-rootPath)
* [transformHumps](#prop-transformHumps)
* [cancelOnRouteChange](#prop-cancelOnRouteChange)
* [unauthorizedInterrupt](#prop-unauthorizedInterrupt)
* [loginPath](#prop-loginPath)

Several methods are available during direct configuration:

* [extendHeaders( headers )](#method-extendHeaders)
* [setKey( key )](#method-setKey)
* [getKey()](#method-getKey)

* * *

### Properties


#### <a id="prop-name"></a>`name`

*String* | Default: `""`

A string to uniquely identify the API service.  This is useful when listening to the [events](#section-events) generated by the service, as you can check it to make sure you're listening to the correct API.  It is exposed on the `options` object sent into the Angular `$http` request, and available as `options.ngName`.

* * *

#### <a id="prop-globalHeaders"></a>`globalHeaders`

*Object* | Default: `{}`

Supplied key/value pairs will be sent as request headers on API calls.  While this property can be accessed directly, calling [extendHeaders( headers )](#method-extendHeaders) is recommended to minimize the danger of losing already-set headers (like the authorization key).

* * *

#### <a id="prop-rootPath"></a>`rootPath`

*String* | Default: `""`

All API requests will be prepended with the supplied string.

* * *

#### <a id="prop-transformHumps"></a>`transformHumps`

*Boolean* | Default: `true`

The request body will have its parameter names changed from camel case to underscore format before being sent, and the response body will have its parameter names changed from underscore to camel case format before arriving.

* * *

#### <a id="prop-cancelOnRouteChange"></a>`cancelOnRouteChange`

*Boolean* | Default: `false`

When the application route changes, any in-progress API calls will be canceled.

* * *

#### <a id="prop-unauthorizedInterrupt"></a>`unauthorizedInterrupt`

*Boolean or Function* | Default: `true`

When a request on a non-login page returns a `401` status code, the normal error-handler events will not be fired, and the request promise will not be rejected. This allows for clean handling of the `APIRequestUnauthorized` event, which may implement a redirect to a login page or otherwise attempt to resolve an authorization error.

When a function is supplied for this value, it should be used as an attempt to resolve the authorization issue.  For example, an expired token could be exchanged for a fresh one, and re-added to the service via `setKey()`.  This function should return a promise that is resolved or rejected depending upon whether or not it was successful in resolving the authorization issue.  If resolved, the original API request will be re-run, along with any other authorization-failing API requests that had been held in a queue while the resolution was being attempted.  If rejected, the `APIAuthorizationFailure` event will be broadcast, along with an optional message sent from the function.

The function will have access to the `data`, `options`, and `status` values from the initial unauthorized request, as defined in the [Promise for HTTP Alias Methods](#promise-return).

```javascript
apiService.unauthorizedInterrupt = function ( data, options, status )
{
    var deferred = $q.defer();

    // TODO: Attempt to resolve authorization issue, then resolve() or reject() promise

    return deferred.promise;
};
```

* * *

#### <a id="prop-loginPath"></a>`loginPath`

*String* | Default: `null`

Redirecting to a login page is outside of the scope of this service's intended function, but you can provide your login path to make sure that the `401`-handling functions of this service (`unauthorizedInterrupt` & `APIRequestUnauthorized`) do not activate when making requests on the login page.  The supplied path will be compared to the value of `$location.path()`.

* * *

### Methods

#### <a id="method-extendHeaders"></a>`extendHeaders( headers )`

Will extend the existing headers object, which contains the authorization key.

##### Arguments

1. `headers` | *Object* | used as the `headers` parameter in the `$http` request

* * *

#### <a id="method-setKey"></a>`setKey( key )`

Sets the key that you will use to authenticate with your API.  The key will be assigned to a header value named `AUTHORIZATION`.

##### Arguments

1. `key` | *String* | the key to authenticate API requests

* * *

#### <a id="method-getKey"></a>`getKey()`

Returns the current value of API key.

##### Returns

*String* | the API key

* * *


## <a id="section-interface"></a>HTTP Interface

The following methods can be called on an instantiated `API` service once it has been injected into your Angular code.

* [queryUrl( path, requestData [, options ] )](#method-queryUrl)
* [$get( path [, requestData ] )](#method-get)
* [$post( path, requestData )](#method-post)
* [$postFile( path, requestData )](#method-postFile)
* [$put( path, requestData )](#method-put)
* [$patch( path, requestData )](#method-patch)
* [$delete( path )](#method-delete)

[Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a id="method-queryUrl"></a>`queryUrl( path, requestData [, options ] )`

Builds a URL from a base path and an object of parameters. This is the method used by `$get`.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object that will be serialized into a query string
3. `options` | *Object* | options object
 * `transformHumps` | *Boolean* | Default: `false` whether to apply decamelize

##### Returns

*String* | `requestData` serialized and append onto `path`

* * *

#### <a id="method-get"></a>`$get( path [, requestData ] )`

Performs an HTTP `GET` request on the supplied API route. If `requestData` is supplied it will be serialized and appended to the request as a query string.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object that will be serialized into a query string

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a id="method-post"></a>`$post( path, requestData )`

Performs an HTTP `POST` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a id="method-postFile"></a>`$postFile( path, requestData )`

Performs an HTTP `POST` request to the supplied API route, sending a single file along as multipart form data. `transformHumps` is set to `false` for this request type automatically.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | a JavaScript `FormData` object with the file data appended

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a id="method-put"></a>`$put( path, requestData )`

Performs an HTTP `PUT` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a id="method-patch"></a>`$patch( path, requestData )`

Performs an HTTP `PATCH` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a id="method-delete"></a>`$delete( path )`

Performs an HTTP `DELETE` request on the supplied API route.

##### Arguments

1. `path` | *String* | an API route

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

### <a id="promise-return"></a>Promise for HTTP Alias Methods

Methods beginning with `$` return an [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Number  | the HTTP status code for the completed request
    }

The promise includes a custom `$cancel` method:

#### `$cancel( [ message, options ] )`

Call to halt the HTTP request while in progress.

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

## <a id="section-events"></a>Events

The following events will broadcast on `$rootScope` during the `API` service's life cycle.

* [APIRequestStart](#event-APIRequestStart)
* [APIRequestComplete](#event-APIRequestComplete)
* [APIRequestSuccess](#event-APIRequestSuccess)
* [APIRequestError](#event-APIRequestError)
* [APIRequestUnauthorized](#event-APIRequestUnauthorized)
* [APIAuthorizationFailure](#event-APIAuthorizationFailure)
* [APIRequestCanceled](#event-APIRequestCanceled)

* * *

#### <a id="event-APIRequestStart"></a>`APIRequestStart`

Broadcast at the start of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request

* * *

#### <a id="event-APIRequestComplete"></a>`APIRequestComplete`

Broadcast upon the completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Number* | the HTTP status code for the completed request

* * *

#### <a id="event-APIRequestSuccess"></a>`APIRequestSuccess`

Broadcast upon the successful completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Number* | the HTTP status code for the completed request

* * *

#### <a id="event-APIRequestError"></a>`APIRequestError`

Broadcast upon the erroneous completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Number* | the HTTP status code for the completed request

* * *

#### <a id="event-APIRequestUnauthorized"></a>`APIRequestUnauthorized`

Broadcast upon the unauthorized (status codes `401`) completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Number* | the HTTP status code for the completed request

* * *

#### <a id="event-APIAuthorizationFailure"></a>`APIAuthorizationFailure`

Broadcast upon the failure of the function supplied via `unauthorizedInterrupt` to successfully resolve an authorization issue.

##### Listener Arguments

1. `failure` | *String* | a message sent from the `unauthorizedInterrupt` function

* * *

#### <a id="event-APIRequestCanceled"></a>`APIRequestCanceled`

Broadcast when the `$cancel` method is called on an API promise.

##### Listener Arguments

1. `options` | *Object* | an object sent when the request was canceled
2. `message` | *String* | a message sent when the request was canceled
