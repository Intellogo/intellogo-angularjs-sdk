'use strict';

(function () {
    angular.module('intellogoSDK')
        .constant('LOG_AUTH_DATA', false)
        /**
         * The API_LOCATION was the original constant which used to hold the
         * API URL. It was widely used in REST communication services for
         * constructing service URLs using plain concatenation. Since the logic
         * for service URL construction is now separated in ServiceUtils,
         * directly concatenating API_LOCATION is discouraged. This is the
         * reason the location constant became INTELLOGO_API_LOCATION and
         * API_LOCATION is now just an alias, which prints a deprecation
         * warning.
         */
        .provider('API_LOCATION', function () {
            this.$get = [
                '$injector',
                '$log',
                function ($injector, $log) {
                    $log.warn(
                        'API_LOCATION is deprecated. Use ServiceUtils for ' +
                        'URL construction instead');

                    return $injector.get('INTELLOGO_API_LOCATION');
                }];
        });
})();
