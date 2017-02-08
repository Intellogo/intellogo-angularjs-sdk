'use strict';

/**
 * @ngdoc service
 * @name rest.TokenHandler
 * @description
 * # TokenHandler
 * Handles access tokens.
 */
angular.module('intellogoSDK').factory(
    'TokenHandler',
    function (LocalStorageBackedVariable, IntellogoCredentials) {
        var ACCESS_TOKEN = 'access_token',
            TOKEN_EXPIRATION = 'token_expiration',
            REFRESH_TOKEN = 'refresh_token';

        var localStorageVarsHolders = {};

        function generateKey(keyName) {
            return IntellogoCredentials.getOauthClientId() + '.' + keyName;
        }

        function getValue(keyName) {
            var key = generateKey(keyName);
            localStorageVarsHolders[key] =
                localStorageVarsHolders[key] || LocalStorageBackedVariable.createHolder(key);
            return localStorageVarsHolders[key].getValue();
        }

        function setValue(keyName, value) {
            var key = generateKey(keyName);
            localStorageVarsHolders[key] =
                localStorageVarsHolders[key] || LocalStorageBackedVariable.createHolder(key);
            localStorageVarsHolders[key].setValue(value);
        }

        function getToken () {
            return getValue(ACCESS_TOKEN);
        }

        function setToken (accessToken) {
            setValue(ACCESS_TOKEN, accessToken);
        }

        function getTokenExpiration () {
            return getValue(TOKEN_EXPIRATION);
        }

        function setTokenExpiration (expiration) {
            setValue(TOKEN_EXPIRATION, expiration);
        }

        function getRefreshToken () {
            return getValue(REFRESH_TOKEN);
        }

        function setRefreshToken (refreshToken) {
            setValue(REFRESH_TOKEN, refreshToken);
        }


        return {
            /**
             * Sets a new value for the access token.
             * @param {String} token The access token.
             */
            setToken: setToken,
            /**
             * Sets the expiration of the current access token.
             * @param {number} timestamp The timestamp.
             */
            setTokenExpiration: setTokenExpiration,
            /**
             * Get the expiration of the current token.
             * @return {number} The expiration.
             */
            getTokenExpiration: getTokenExpiration,
            /**
             * Sets a new value for the refresh token.
             * @param {String} token The refresh token.
             */
            setRefreshToken: setRefreshToken,
            /**
             * @returns {String} The current access token.
             */
            getToken: getToken,
            /**
             * @returns {String} The current refresh token.
             */
            getRefreshToken: getRefreshToken,

            resetTokens: function () {
                setToken(null);
                setRefreshToken(null);
                setTokenExpiration(0);
            }
        };
    });
