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
        function ($http, $resource, ServiceUtils) {
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

            var usersResource = $resource(
                ServiceUtils.constructServiceUrl('users', ':id'),
                {id: '@userId'}
            );

            return {
                getUsersByUsername: getUsersByUsernameSearch,
                getUsersByIds     : getUsersByIds,
                get: usersResource.get.bind(usersResource),
                save: usersResource.save.bind(usersResource),
                query: usersResource.query.bind(usersResource),
                remove: usersResource.remove.bind(usersResource),
                delete: usersResource.delete.bind(usersResource)
            };
        });
