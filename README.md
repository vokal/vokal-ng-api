# vokal-ng-api

> Vokal's common Angular API service. Wraps Angular's `$http` service.


## Configuration

The following properties and methods are available in your app's config block via `APIProvider`.

### Properties

#### `transformHumps`

*Boolean* | Default: `true`

Your request body will have its parameter names changed from camel case to underscores before being sent, and the response body will have its parameter names changed from underscores to camel case before arriving.

* * *

#### `cancelOnRouteChange`

*Boolean* | Default: `false`

When your application route changes, any in-progress API calls will be cancled.

* * *

#### `unauthorizedInterrupt`

*Boolean* | Default: `true`

When an API route returns a 401 or 403 status code, the normal error-handler events will not be fired, to make any redirect handling attached to the unauthorized route function without unintended incident.

* * *

### Methods

#### `setHeaders( headers )`

Will extend the existing headers object, which contains the authorization key.

##### Arguments

1. `headers` | *Object* | used as the `headers` parameter in the `$http` request

* * *

#### `setRootPath( path )`

Will prepend all API requests with the supplied string.

##### Arguments

1. `path` | *String* | fragment to prepend

* * *


## Interface

The following methods can be called on the `API` service once injected into your Angular code.

### Methods

#### `setKey( key )`

Sets the key that you will use to authenticate with your API.  The key will be assigned to a header value named `AUTHORIZATION`.

##### Arguments

1. `key` | *String* | the key to authenticate API requests

* * *

#### `getKey()`

Returns the current value of API key.

##### Returns

*String* | the API key

* * *

#### `queryUrl( path, requestData )`

Builds a URL from a base path and an object of parameters. This is the method used by `$get`.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object that will be serialized into a query string

##### Returns

*String* | `requestData` serialized and append onto `path`

* * *

#### `$get( path [, requestData ] )`

Performs an HTTP `GET` request on the supplied API route. If `requestData` is supplied it will be serialized and appended to the request as a query string.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object that will be serialized into a query string

##### Returns

*Object* | An [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise also comes with a custom `$cancel` method that can be called to halt the HTTP request while in-progress.  The `$cancel` method takes two optional arguments:

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

#### `$post( path, requestData )`

Performs an HTTP `POST` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | An [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise also comes with a custom `$cancel` method that can be called to halt the HTTP request while in-progress.  The `$cancel` method takes two optional arguments:

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

#### `$postFile( path, requestData )`

Performs an HTTP `POST` request to the supplied API route, sending a single file along as multipart form data. `transformHumps` is set to `false` for this request type automatically.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | a JavaScript `FormData` object with the file data appended

##### Returns

*Object* | An [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise also comes with a custom `$cancel` method that can be called to halt the HTTP request while in-progress.  The `$cancel` method takes two optional arguments:

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

#### `$put( path, requestData )`

Performs an HTTP `PUT` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | An [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise also comes with a custom `$cancel` method that can be called to halt the HTTP request while in-progress.  The `$cancel` method takes two optional arguments:

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

#### `$patch( path, requestData )`

Performs an HTTP `PATCH` request to the supplied API route.

##### Arguments

1. `path` | *String* | an API route
2. `requestData` | *Object* | an object containing the request payload

##### Returns

*Object* | An [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise also comes with a custom `$cancel` method that can be called to halt the HTTP request while in-progress.  The `$cancel` method takes two optional arguments:

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

#### `$delete( path )`

Performs an HTTP `DELETE` request on the supplied API route.

##### Arguments

1. `path` | *String* | an API route

##### Returns

*Object* | An [Angular promise](https://docs.angularjs.org/api/ng/service/$q) that resolves upon completion of the API request.  The resolve/reject handlers are passed a response object with the following format:

    {
        data:    Object  | the response from the $http request,
        options: Object  | the options that were passed into the $http request,
        status:  Integer | the HTTP status code for the completed request
    }

The promise also comes with a custom `$cancel` method that can be called to halt the HTTP request while in-progress.  The `$cancel` method takes two optional arguments:

1. `message` | *String* | a text message to describe the cancellation
2. `options` | *Object* | an object to describe the canceled request

* * *

## Events

The following events will broadcast on `$rootScope` during the `API` service's life cycle.

#### `APIRequestStart`

Broadcasted at the start of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request

* * *

#### `APIRequestComplete`

Broadcasted upon the completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### `APIRequestSuccess`

Broadcasted upon the successful completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### `APIRequestError`

Broadcasted upon the erroneous completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### `APIRequestUnauthorized`

Broadcasted upon the unauthorized (status codes `401` or `403`) completion of any API request.

##### Listener Arguments

1. `options` | *Object* | the options that were passed into the `$http` request
2. `data` | *Object* | the response from the `$http` request
3. `status` | *Integer* | the HTTP status code for the completed request

* * *

#### `APIRequestCanceled`

Broadcasted when the `$cancel` method is called on an API promise.

##### Listener Arguments

1. `options` | *Object* | an object sent when the request was canceled
2. `message` | *String* | a message sent when the request was canceled
