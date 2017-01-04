'use strict';

/**
 * @ngdoc service
 * @name rest.UserDataService
 * @description
 * # UserDataService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
    'UserDataService',
    function ($http, $q, UserDataHandler, API_LOCATION) {

        function loadUserData() {
            var deferred = $q.defer();
            var response = $http.get(API_LOCATION + '/api/currentUser/info');
            response.success(function (userData) {
                UserDataHandler.setUserType(userData.userType);
                UserDataHandler.setContentSourcesRestriction(
                    userData.sourcesRestriction);
                UserDataHandler.setDefaultSource(userData.defaultSource);
                UserDataHandler.setCategoriesRestriction(
                    userData.categoriesRestriction);
                UserDataHandler.setUserImagePath(userData.image);
                deferred.resolve();
            });
            response.error(function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function resetUserData() {
            UserDataHandler.resetValues();
        }

        return {
            loadUserData: loadUserData,
            resetUserData: resetUserData
        };
    });
