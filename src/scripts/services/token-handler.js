'use strict';

/**
 * @ngdoc service
 * @name rest.TokenHandler
 * @description
 * # TokenHandler
 * Handles access tokens.
 */
angular.module('rest').factory(
    'TokenHandler',
    function (LocalStorageBackedVariable) {
        var tokenHolder =
                LocalStorageBackedVariable.createHolder('token'),
            refreshTokenHolder =
                LocalStorageBackedVariable.createHolder('refresh_token'),
            expirationHolder =
                LocalStorageBackedVariable.createHolder('expiration');

        return {
            /**
             * Sets a new value for the access token.
             * @param {String} token The access token.
             */
            setToken: tokenHolder.setValue,
            /**
             * Sets the expiration of the current access token.
             * @param {number} timestamp The timestamp.
             */
            setTokenExpiration: expirationHolder.setValue,
            /**
             * Get the expiration of the current token.
             * @return {number} The expiration.
             */
            getTokenExpiration: expirationHolder.getValue,
            /**
             * Sets a new value for the refresh token.
             * @param {String} token The refresh token.
             */
            setRefreshToken: refreshTokenHolder.setValue,
            /**
             * @returns {String} The current access token.
             */
            getToken: tokenHolder.getValue,
            /**
             * @returns {String} The current refresh token.
             */
            getRefreshToken: refreshTokenHolder.getValue,

            resetTokens: function () {
                tokenHolder.setValue(null);
                refreshTokenHolder.setValue(null);
                expirationHolder.setValue(0);
            }
        };
    });
