'use strict';

describe('Service: AuthInterceptor', function () {
    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var AuthInterceptor, TokenHandler, $location;
    beforeEach(inject(function (_AuthInterceptor_, _TokenHandler_, _$location_) {
        AuthInterceptor = _AuthInterceptor_;
        TokenHandler = _TokenHandler_;
        $location = _$location_;
    }));

    it('should properly intercept requests', function () {
        TokenHandler.setToken('trololo');
        var config = {url: 'http://baz.com'};
        expect(AuthInterceptor.request(config).url)
            .toBe('http://baz.com?access_token=trololo');
    });

    it('should properly intercept requests with query parameters', function () {
        TokenHandler.setToken('trololo');
        var config = {url: 'http://baz.com?a=b'};
        expect(AuthInterceptor.request(config).url)
            .toBe('http://baz.com?a=b&access_token=trololo');
    });

    it('should not intercept requests if there isn\'t an access token', function () {
        TokenHandler.setToken('');
        var config = {url: 'http://baz.com'};
        expect(AuthInterceptor.request(config).url)
            .toBe('http://baz.com');
    });

    it('should not intercept requests for views', function () {
        TokenHandler.setToken('lol');
        var config = {url: 'views/praz.1'};
        expect(AuthInterceptor.request(config).url)
            .toBe('views/praz.1');
    });

    it('should not intercept requests for HTML files', function () {
        TokenHandler.setToken('lol');
        var config = {url: 'http://baz.com/birov.html'};
        expect(AuthInterceptor.request(config).url)
            .toBe('http://baz.com/birov.html');
    });

    it('should not intercept requests for SVG files', function () {
        TokenHandler.setToken('lol');
        var config = {url: 'http://baz.com/birov.svg'};
        expect(AuthInterceptor.request(config).url)
            .toBe('http://baz.com/birov.svg');
    });

    it('should properly intercept 401 responses', function () {
        TokenHandler.setToken('');
        var config = {status: 401};
        AuthInterceptor.responseError(config);
        expect($location.path()).toBe('/login');
    });

    xit('should properly intercept responses with zero status code', function () {
        TokenHandler.setToken('');
        var config = {status: 0};
        AuthInterceptor.responseError(config);
        expect($location.path()).toBe('/login');
    });

    it('should not intercept successful responses', function () {
        TokenHandler.setToken('');
        var config = {status: 200};
        AuthInterceptor.responseError(config);
        expect($location.path()).toBe('');
    });
});
