'use strict';

/**
 * @ngdoc service
 * @name rest.LiveConfigService
 * @description
 * # LiveConfigService
 * Services for loading and updating the server configuration.
 */
angular.module('rest')
    .factory(
    'LiveConfigService',
    function ($http, API_LOCATION) {
        function getConfig () {
            return $http.get(API_LOCATION + '/api/admin/config');
        }

        function saveConfig (config) {
            return $http.post(API_LOCATION + '/api/admin/config', config);
        }

        function restoreDefaults () {
            return $http.post(API_LOCATION +
                              '/api/admin/config/restoreDefaults');
        }

        return {
            getConfig: getConfig,
            saveConfig: saveConfig,
            restoreDefaults: restoreDefaults
        };
    });
