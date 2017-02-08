'use strict';

angular.module('intellogoSDK', ['ngResource'])
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    })
    .run(function ($rootScope, INTELLOGO_EVENTS, AuthService) {
        $rootScope.$on(INTELLOGO_EVENTS.AUTHENTICATE_PASSWORD,
                       function (event, username, password, force) {
                           AuthService.loginWithPassword(username,
                                                         password,
                                                         force);
                       }
        );
        $rootScope.$on(INTELLOGO_EVENTS.AUTHENTICATE_CLIENT_SECRET,
                       function () {
                           AuthService.loginWithClientCredentials();
                       }
        );
        $rootScope.$on(INTELLOGO_EVENTS.LOGOUT,
                       function () {
                           AuthService.logout();
                       }
        );

        if (!(window.hasOwnProperty('TEST_MODE') && window.TEST_MODE)) {
            /*
             Do not refresh access tokens and stuff when running in a test
             runner.
             */
            AuthService.initializeRefresh();
        }
    })
    .config(function ($provide) {
        /*
         * This adds #success and #error methods to $q promises, to make
         * them look like regular HttpPromise objects.
         */
        $provide.decorator('$q', function ($delegate) {
            var defer = $delegate.defer;
            $delegate.defer = function () {
                var deferred = defer();
                deferred.promise.success = function (fn) {
                    deferred.promise.then(_.ary(fn, 1));
                    return deferred.promise;
                };
                deferred.promise.error = function (fn) {
                    deferred.promise.then(null, _.ary(fn, 1));
                    return deferred.promise;
                };
                return deferred;
            };
            return $delegate;
        });
    });
