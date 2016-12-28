'use strict';

/**
 * @ngdoc service
 * @name rest.VersionService
 * @description
 * # VersionService
 * Factory in the rest.
 */
angular.module('rest')
    .factory(
        'VersionService',
        function ($http, $q, API_LOCATION) {
            var cachedVersion;

            function getVersion() {
                var deferred = $q.defer();
                if (cachedVersion) {
                    setTimeout(function () {
                        deferred.resolve(cachedVersion);
                    }, 0);
                } else {
                    // The code below does a plain GET, but bypasses the JSON
                    // parsing done by angular, since the request is not in
                    // JSON format.
                    var response = $http(
                        {
                            url: API_LOCATION + '/version',
                            method: 'GET',
                            transformResponse: [
                                function (data) {
                                    return data;
                                }
                            ]
                        });
                    response.success(function (version) {
                        cachedVersion = version;
                        deferred.resolve(cachedVersion);
                    });
                    response.error(function (err) {
                        deferred.reject(err);
                    });
                }
                return deferred.promise;
            }

            return {
                getVersion: getVersion
            };
        });
