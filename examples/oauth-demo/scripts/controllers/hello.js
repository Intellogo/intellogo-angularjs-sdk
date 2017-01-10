'use strict';

/**
 * @ngdoc function
 * @name demoApp.controller:HelloCtrl
 * @description
 */
angular.module('demoApp').controller(
    'HelloCtrl',
    function ($scope, INTELLOGO_EVENTS, ClientService) {
        $scope.client = ClientService.me();
        $scope.onLogoutClicked = function () {
            $scope.$emit(INTELLOGO_EVENTS.LOGOUT);
        };
    });
