# vokal-ng-api

> Vokal's common Angular API service. Wraps Angular's `$http` service.

* [Configuration](#section-config)
* [Interface](#section-interface)
* [Events](#section-events)


## <a name="section-config"></a>Configuration

The following properties and methods are available in your app's config block via `APIProvider`.

* Properties
  * [transformHumps](#prop-transformHumps)
  * [cancelOnRouteChange](#prop-cancelOnRouteChange)
  * [unauthorizedInterrupt](#prop-unauthorizedInterrupt)
* Methods
  * [setHeaders( headers )](#method-setHeaders)
  * [setRootPath( path )](#method-setRootPath)

* * *

### Properties

#### <a name="prop-transformHumps"></a>`transformHumps`

*Boolean* | Default: `true`

Your request body will have its parameter names changed from camel case to underscores before being sent, and the response body will have its parameter names changed from underscores to camel case before arriving.

* * *

#### <a name="prop-cancelOnRouteChange"></a>`cancelOnRouteChange`

*Boolean* | Default: `false`

When your application route changes, any in-progress API calls will be cancled.

* * *

#### <a name="prop-unauthorizedInterrupt"></a>`unauthorizedInterrupt`

*Boolean* | Default: `true`

When an API route returns a 401 or 403 status code, the normal error-handler events will not be fired. This allows any redirect handling attached to the unauthorized route function to run without conflict.

* * *

### Methods

#### <a name="method-setHeaders"></a>`setHeaders( headers )`

Will extend the existing headers object, which contains the authorization key.

##### Arguments

1. `headers` | *Object* | used as the `headers` parameter in the `$http` request

* * *

#### <a name="method-setRootPath"></a>`setRootPath( path )`

Will prepend all API requests with the supplied string.

##### Arguments

1. `path` | *String* | fragment to prepend

* * *


## <a name="section-interface"></a>Interface

The following methods can be called on the `API` service once injected into your Angular code.

* [setKey( key )](#method-setKey)
* [getKey()](#method-getKey)
* [queryUrl( path, requestData )](#method-queryUrl)
* [$get( path [, requestData ] )](#method-get)
* [$post( path, requestData )](#method-post)
* [$postFile( path, requestData )](#method-postFile)
* [$put( path, requestData )](#method-put)
* [$patch( path, requestData )](#method-patch)
* [$delete( path )](#method-delete)

[Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a name="method-setKey"></a>`setKey( key )`

Sets the key that you will use to authenticate with your API.  The key will be assigned to a header value named `AUTHORIZATION`.

##### Arguments

1. `key` | *String* | the key to authenticate API requests

* * *

#### <a name="method-getKey"></a>`getKey()`

Returns the current value of API key.

##### Returns

*String* | the API key

* * *

#### <a name="method-queryUrl"></a>`queryUrl( path, requestData )`

Builds a URL from a base path and an object of parameters. This is the method used by `$get`.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object that will be serialized into a query string

##### Returns

*String* | `requestData` serialized and append onto `path`

* * *

#### <a name="method-get"></a>`$get( path [, requestData ] )`

Performs an HTTP `GET` request on the supplied API route. If `requestData` is supplied it will be serialized and appended to the request as a query string.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object that will be serialized into a query string

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a name="method-post"></a>`$post( path, requestData )`

Performs an HTTP `POST` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a name="method-postFile"></a>`$postFile( path, requestData )`

Performs an HTTP `POST` request to the supplied API route, sending a single file along as multipart form data. `transformHumps` is set to `false` for this request type automatically.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | a JavaScript `FormData` object with the file data appended

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a name="method-put"></a>`$put( path, requestData )`

Performs an HTTP `PUT` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a name="method-patch"></a>`$patch( path, requestData )`

Performs an HTTP `PATCH` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

#### <a name="method-delete"></a>`$delete( path )`

Performs an HTTP `DELETE` request on the supplied API route.

##### Arguments

1. `path` | *String* | an API route

##### Returns

*Object* | see [Promise for HTTP Alias Methods](#promise-return)

* * *

### <a name="promise-return"></a>Promise for HTTP Alias Methods

Methods beginning with `$` return an [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise includes a custom `$cancel` method:

#### `$cancel( [ message, options ] )`

Call to halt the HTTP request while in progress.

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

## <a name="section-events"></a>Events

The following events will broadcast on `$rootScope` during the `API` service's life cycle.

* [APIRequestStart](#event-APIRequestStart)
* [APIRequestComplete](#event-APIRequestComplete)
* [APIRequestSuccess](#event-APIRequestSuccess)
* [APIRequestError](#event-APIRequestError)
* [APIRequestUnauthorized](#event-APIRequestUnauthorized)
* [APIRequestCanceled](#event-APIRequestCanceled)

* * *

#### <a name="event-APIRequestStart"></a>`APIRequestStart`

Broadcast at the start of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request

* * *

#### <a name="event-APIRequestComplete"></a>`APIRequestComplete`

Broadcast upon the completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### <a name="event-APIRequestSuccess"></a>`APIRequestSuccess`

Broadcast upon the successful completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### <a name="event-APIRequestError"></a>`APIRequestError`

Broadcast upon the erroneous completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### <a name="event-APIRequestUnauthorized"></a>`APIRequestUnauthorized`

Broadcast upon the unauthorized (status codes `401` or `403`) completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### <a name="event-APIRequestCanceled"></a>`APIRequestCanceled`

Broadcast when the `$cancel` method is called on an API promise.

##### Listener Arguments

1. `options` | *Object* | an object sent when the request was canceled
2. `message` | *String* | a message sent when the request was canceled
