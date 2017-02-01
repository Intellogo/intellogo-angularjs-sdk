Angular.js SDK for the [Intellogo](http://intellogo.com) REST API.
Provides wrapper methods for using most of Intellogo's functionality:

* Retrieval of recommended content for insights, smart collections, or other content
* creating and managing insights and smart collections
* content ingestion

Note: Some of the functionality requires your clientId to have admin privileges. If in doubt, check with the official [API documentation](https://production.intellogo.com/swagger)

---

#Usage

The main script that needs to be included in your application is `dist/intellogo-sdk.js`. This will make available an Angular.js module named `intellogoSDK` that you should add as a dependency of your own application.

## Authentication
### Credentials
The Intellogo API authentication is based on the OAuth2 protocol. Our Angular.js SDK takes care of generating an access token for you and refreshing it at the required intervals. Before using the API, you only need to register your credentials by calling `AuthService.setClientCredentials(<myClientId>, <myClientSecret>)`.

### Token Retrieval
An access token will not be retrieved until you request one to be generated. This needs to happen before you start using any of the SDK's methods.
Depending on your client type, you will be able to do that using one of the following OAuth2 grant types:

* __Client Credentials__ grant type: This grant type allows an authenticated OAuth2 client (your application) to access non-user-specific content provided by Intellogo, which includes most content currently in the system.
In order to retrieve a token, you need to emit the `INTELLOGO_EVENTS.AUTHENTICATE_CLIENT_SECRET` event with no parameters:
```
$scope.$emit(INTELLOGO_EVENTS.AUTHENTICATE_CLIENT_SECRET);
```
Alternatively, you can just call the relevant method in `AuthService`:
```
AuthService.loginWithClientCredentials();
```
* __Resource Owner Password Credentials__ grant type: This requires the direct usage of the username and password of an Intellogo user. It is available only to trusted applications.
In order to retrieve a token, you will need to emit the `INTELLOGO_EVENTS.AUTHENTICATE_PASSWORD` event to the global scope with the proper username and password:
```
$scope.$emit(INTELLOGO_EVENTS.AUTHENTICATE_PASSWORD,
             username,
             password);
```
Alternatively, you can just call the relevant method in `AuthService`:
```
AuthService.loginWithPassword(username, password);
```

When the authentication process is completed, the Intellogo SDK will emit an event on the global scope. You should wait for that event before you use any of the SDK services. The events you should listen for are:

* `INTELLOGO_EVENTS.AUTHENTICATION_SUCCESS`: Will be broadcast upon successful authentication
* `INTELLOGO_EVENTS.AUTHENTICATION_FAILURE`: Will be broadcast if there is a problem during authentication.

### Refresh Token
OAuth2 access tokens have relatively short expiration time - usually one hour. However, the Intellogo SDK offers automatic token refresh functionality that is enabled by default.

### Token Revocation
If for some reason you want to revoke your current token, you can log out simply by emitting the `INTELLOGO_EVENTS.LOGOUT` event:
```
$scope.$emit(INTELLOGO_EVENTS.LOGOUT);
```
Or, you can directly call `AuthService.logout()`.

After that, you will need to authenticate again before you can use any Intellogo services.

# Available Services
[This](service_docs.md) is a list of the supported Intellogo services. Each provided service corresponds to an API group as seen in the Intellogo swagger documentation, e.g. ContentService is a wrapper for sending requests for `/api/contents/*` endpoints. For more information about parameters and their usage, refer to the [API documentation](https://production.intellogo.com/swagger).

# Example
A simple example application can be seen in `examples/oauth-demo`.