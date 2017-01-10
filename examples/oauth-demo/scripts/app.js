'use strict';

angular
    .module('demoApp', [
        'intellogoSDK',
        'ngRoute'
    ])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'AuthenticateCtrl'
            })
            .when('/hello', {
                templateUrl: 'views/hello.html',
                controller: 'HelloCtrl'
            })
            .otherwise({
                           redirectTo: '/login'
                       });
    })
    .run(function ($rootScope, $location, INTELLOGO_EVENTS, AuthService) {
        $rootScope.$on(
            INTELLOGO_EVENTS.LOGOUT,
            function () {
                $location.path('/login');
            }
        );
        $rootScope.$on(
            INTELLOGO_EVENTS.AUTHENTICATION_SUCCESS,
            function () {
                $location.path('/hello');
            });

        $rootScope.$on(
            INTELLOGO_EVENTS.AUTHENTICATION_FAILURE,
            function () {
                alert('Bad client credentials');
            });

        $rootScope.$on('$locationChangeStart', function (event, nextLocation) {
            if (!AuthService.isLoggedIn() && !nextLocation.match('login$')) {
                event.preventDefault();
                $location.path('/login');
            }
        });
    });
