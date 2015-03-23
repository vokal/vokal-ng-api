# vokal-ng-api

> VOKAL's common Angular API service.


## Configuration

The following properties and methods are available in your app's config block via `APIProvider`.

### Properties

#### `transformHumps`

Type: *Boolean*
Default: `true`

Your request body will have its parameter names changed from camel case to underscores before being sent, and the response body will have its parameter names changed from underscores to camel case before arriving.

#### `cancelOnRouteChange`

Type: *Boolean*
Default: `false`

When your application route changes, any in-progress API calls will be cancled.

#### `unauthorizedInterrupt`

Type: *Boolean*
Default: `true`

When an API route returns a 401 or 403 status code, the normal error-handler events will not be fired, to make any redirect handling attached to the unauthorized route function without unintended incident.

### Methods

#### `setHeaders( headers )`

Will extend the existing headers object, which contains the authorization key.

##### Arguments

1. `headers` | *Object* | used as the `headers` parameter in the `$http` request

#### `setRootPath( path )`

Will prepend all API requests with the supplied string.

##### Arguments

1. `path` | *String* | fragment to prepend


## Interface

The following methods can be called on the `API` service once injected into your Angular code.

method | accepts | description
------ | ------- | -----------
setKey( key ) | String | Pass in the key that you will use to authenticate with your API routes.  The key will be assigned to a header value named `AUTHORIZATION`.
getKey() | | Returns the API key, once set.
queryUrl( path, requestData ) | String, Object | Appends requestData onto path, returning a full query string. This is the method used by $get.
$get( path[, requestData] ) | String[, Object] | Performs an HTTP `GET` request on the supplied API route. If requestData is supplied and an object it will be appended to the query string.
$post( path, requestData ) | String, Object | Performs an HTTP `POST` request to the supplied API route, with the supplied data.
$postFile( path, requestData ) | String, FormData | Performs an HTTP `POST` request to the supplied API route, sending a single file along as multipart form data.  `transformHumps` is set to `false` for this request type automatically.
$put( path, requestData ) | String, Object | Performs an HTTP `PUT` request to the supplied API route, with the supplied data.
$patch( path, requestData ) | String, Object | Performs an HTTP `PATCH` request to the supplied API route, with the supplied data.
$delete( path ) | String | Performs an HTTP `DELETE` request on the supplied API route.

Methods beginning with `$` will return a promise that resolves upon completion of the API request as an object ( data, status, and options ).  You can attach success and failure handlers via `.then()`.  The promise also comes with a `$cancel` method that can be called to halt any in-progress HTTP request.

## Events

The following events will be broadcast on `$rootScope` during the `API` service's lifecycle.

event | returns | description
----- | ------- | -----------
APIRequestStart | options | Broadcast at the start of any API request, returns the options that were passed into the `$http` request.
APIRequestComplete | options | Broadcast upon the completion of any API request, returns the options that were passed into the `$http` request, the data in the response, and the status code of the response.
APIRequestSuccess | options, data, status | Broadcast upon the successful completion of any API request, returns the options that were passed into the `$http` request, the data in the response, and the status code of the response.
APIRequestError | options, data, status | Broadcast upon the erroneous completion of any API request, returns the options that were passed into the `$http` request, the data in the response, and the status code of the response.
APIRequestUnauthorized | options, data, status | Broadcast upon the unauthorized (status codes `401` or `403`) completion of any API request, returns the options that were passed into the `$http` request, the data in the response, and the status code of the response.
APIRequestCanceled | options | Broadcast when the `$cancel` method is called on an API promise, returns the options that were passed into the `$http` request.
