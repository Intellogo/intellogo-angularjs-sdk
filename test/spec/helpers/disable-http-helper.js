'use strict';

angular.module('intellogoSDK')
    .factory('BlockHttpInterceptor', function () {
                 return {
                     request: function (config) {
                         var url = config.url;
                         if (url.indexOf('views/') !== 0) {
                             throw new Error(
                                 'An HTTP request hit $http. Put a spy ' +
                                 'instead of calling the actual service. The ' +
                                 'problematic URL is: ' + url);
                         }
                         return config;
                     }
                 };
             });


beforeEach(module('intellogoSDK', function ($httpProvider) {
    $httpProvider.interceptors.push('BlockHttpInterceptor');
}));
