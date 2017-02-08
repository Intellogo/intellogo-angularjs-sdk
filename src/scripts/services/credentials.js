'use strict';

angular.module('intellogoSDK').factory(
    'IntellogoCredentials',
    function () {
        var clientId, clientSecret;
        return {
            getOauthClientId: function () {
                return clientId;
            },
            getOauthClientSecret: function () {
                return clientSecret;
            },
            setClientCredentials: function (id, secret) {
                clientId = id;
                clientSecret = secret;
            }
        };
    });
