'use strict';

describe('Service: AuthService', function () {
    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var AuthService, TokenHandler, http;
    beforeEach(inject(function (_AuthService_, _TokenHandler_, $http) {
        AuthService = _AuthService_;
        TokenHandler = _TokenHandler_;
        http = $http;
    }));

    it('should execute authentication', function () {
        // jshint camelcase:false
        spyOn(http, 'post').and.returnValue(
            window.HttpMockHelper.mockHttpPromise(
                {
                    access_token: 'abc',
                    refresh_token: 'def',
                    expires_in: 30000
                },
                null)
        );

        AuthService.loginWithPassword('foo', 'bar');

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getOauthEndpoint('/token'),
            'username=foo&password=bar&grant_type=password&client_id=testApplication&client_secret=ChuckNorris',
            {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        expect(TokenHandler.getRefreshToken()).toEqual('def');
        expect(TokenHandler.getToken()).toEqual('abc');
    });

    it('should execute authentication with client secret', function () {
        // jshint camelcase:false
        spyOn(http, 'post').and.returnValue(
            window.HttpMockHelper.mockHttpPromise(
                {
                    access_token: 'abc',
                    refresh_token: 'def',
                    expires_in: 30000
                },
                null)
        );

        AuthService.loginWithClientCredentials();

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getOauthEndpoint('/token'),
            'grant_type=client_credentials&client_id=testApplication&client_secret=ChuckNorris',
            {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        expect(TokenHandler.getRefreshToken()).toEqual('def');
        expect(TokenHandler.getToken()).toEqual('abc');
    });

    it('should refresh', function () {
        // jshint camelcase:false
        spyOn(http, 'post').and.returnValue(
            window.HttpMockHelper.mockHttpPromise(
                {
                    access_token: 'abc',
                    refresh_token: 'def',
                    expires_in: 30000
                },
                null)
        );

        TokenHandler.setRefreshToken('baz');

        AuthService.refresh();

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getOauthEndpoint('/token'),
            'grant_type=refresh_token&client_id=testApplication&client_secret=ChuckNorris&refresh_token=baz',
            {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        expect(TokenHandler.getToken()).toEqual('abc');
    });


    it('should logout', function () {
        TokenHandler.setToken('bla');
        TokenHandler.setRefreshToken('boo');

        AuthService.logout();

        expect(TokenHandler.getRefreshToken()).toEqual(null);
        expect(TokenHandler.getToken()).toEqual(null);
    });
});
