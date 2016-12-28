'use strict';

angular.module('rest')
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


beforeEach(module('rest', function ($httpProvider) {
    $httpProvider.interceptors.push('BlockHttpInterceptor');
}));
