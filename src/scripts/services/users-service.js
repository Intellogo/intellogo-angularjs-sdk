'use strict';

/**
 * @ngdoc service
 * @name intellogoSDK.UserDataService
 * @description
 * # UserDataService
 */
angular.module('intellogoSDK')
    .factory(
        'UsersService',
        function ($http, ServiceUtils) {
            function getUsersByUsernameSearch(username) {
                var url = ServiceUtils.constructServiceUrl(
                    'users',
                    'all',
                    ServiceUtils.constructQueryParameters({search: username}));
                return $http.get(url);
            }

            function getUsersByIds(userIds) {
                var url = ServiceUtils.constructServiceUrl(
                    'users',
                    'all',
                    ServiceUtils.constructQueryParameters({userIds: userIds}));
                return $http.get(url);
            }

            return {
                getUsersByUsername: getUsersByUsernameSearch,
                getUsersByIds     : getUsersByIds
            };
        });
