'use strict';

/**
 * @ngdoc service
 * @name rest.AuthInterceptor
 * @description
 * # AuthInterceptor
 * Intercepts AJAX requests to implement authentication. Does two main things:
 * - adds proper access tokens to requests
 * - monitors error responses in order to catch 401s and redirect the user to
 *   the login page if necessary
 * @see AuthService
 */
angular.module('rest').factory(
    'AuthInterceptor', function (UrlUtils, $location, $q, TokenHandler) {
        return {
            request: function (config) {
                function isTokenNeeded(url) {

                    return url.indexOf('views/') !== 0 &&
                        url.indexOf('.html') <= 0 &&
                        url.indexOf('.svg') <= 0;
                }

                if (isTokenNeeded(config.url)) {
                    config.url = UrlUtils.addAccessTokenToUrl(config.url);
                }
                return config;
            },
            responseError: function (config) {
                // On localhost the status is 0. Unfortunately, we can get
                // status 0 in many other situations (e.g. reloading when an
                // AJAX request is running).
                if (config.status === 401) {
                    console.log('Unauthorized, redirecting to login page.');
                    
                    // clear expired token
                    TokenHandler.resetTokens();
                    
                    $location.path('/login');
                }
                return $q.reject(config);
            }
        };
    });
