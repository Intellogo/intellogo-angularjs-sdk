'use strict';

angular
    .module('demoApp', [
        'intellogoSDK',
        'ngRoute'
    ])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/hello.html',
                controller: 'HelloCtrl'
            })
            .otherwise({
                           redirectTo: '/'
                       });
    })
    .run(function ($rootScope, $location, INTELLOGO_EVENTS, UserDataService) {
        $rootScope.$on(
            INTELLOGO_EVENTS.LOGOUT,
            function () {
                UserDataService.resetUserData();
                //$location.path('/login');
            }
        );
        $rootScope.$on(
            INTELLOGO_EVENTS.AUTHENTICATION_SUCCESS,
            function () {
                UserDataService.loadUserData().success(function () {
                    $location.path('/');
                });
            }
        );
        $rootScope.$on(
            INTELLOGO_EVENTS.AUTHENTICATION_FAILURE,
            function () {
                //alert('The username and password that you entered ' +
                //      'don\'t match.');
            });

        setTimeout(function () {
            $rootScope.$emit(INTELLOGO_EVENTS.AUTHENTICATE_CLIENT_SECRET);
        }, 1000);
    });
