'use strict';

/**
 * @ngdoc service
 * @name rest.urlUtils
 * @description
 * # urlUtils
 * Service in the rest.
 */
angular.module('rest').factory(
    'UrlUtils',
    function (TokenHandler) {
        function addAccessTokenToUrl(url) {
            var startCharacter = (url.indexOf('?') > 0 ? '&' : '?'),
                currentAccessToken = TokenHandler.getToken();

            if (!currentAccessToken) {
                return url;
            }

            return url + startCharacter + 'access_token=' +
                currentAccessToken;
        }

        return {
            addAccessTokenToUrl: addAccessTokenToUrl
        };
    });
