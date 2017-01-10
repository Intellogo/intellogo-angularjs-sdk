'use strict';

/**
 * @ngdoc function
 * @name demoApp.controller:AuthenticateCtrl
 * @description
 * # AuthenticateCtrl
 */
angular.module('demoApp').controller(
    'AuthenticateCtrl',
    function ($scope, INTELLOGO_EVENTS) {
        $scope.onAuthenticateClicked = function () {
            $scope.$emit(INTELLOGO_EVENTS.AUTHENTICATE_CLIENT_SECRET);
        };
    });
