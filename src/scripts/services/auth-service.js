'use strict';
// jshint maxparams:false

/**
 * @ngdoc service
 * @name rest.AuthService
 * @description
 * # AuthService
 * Factory in the IntellogoSDK.
 */
angular.module('intellogoSDK').factory(
    'AuthService',
    function ($rootScope, $http, $window, $timeout, $injector, TokenHandler,
              API_LOCATION, LOG_AUTH_DATA, INTELLOGO_EVENTS) {
        var refreshTimer;
        var clientId;
        var clientSecret;

        function setClientCredentials(oauthClientId, oauthClientSecret) {
            clientId = oauthClientId;
            clientSecret = oauthClientSecret;
        }

        /**
         * Dynamically gets the OAuth client ID.
         * @return {String}
         */
        function getOauthClientId() {
            return clientId;
        }

        /**
         * Dynamically gets the OAuth client secret.
         * @return {String}
         */
        function getOauthClientSecret() {
            return clientSecret;
        }

        function handleResult(data, announceLogin) {
            // jshint camelcase:false
            if (LOG_AUTH_DATA) {
                console.log('recv ', data);
            }
            TokenHandler.setToken(data.access_token);
            TokenHandler.setRefreshToken(data.refresh_token);

            var tokenExpiresInSeconds = data.expires_in,
                tokenExpiration = new Date().getTime() +
                    tokenExpiresInSeconds * 1000;
            TokenHandler.setTokenExpiration(tokenExpiration);
            initializeRefresh();

            if (announceLogin) {
                $rootScope.$broadcast(INTELLOGO_EVENTS.AUTHENTICATION_SUCCESS);
            }
        }

        function executeRevoke(payload) {
            var payloadEncoded = $window.$.param(payload);

            return $http.post(
                API_LOCATION + '/oauth/revoke',
                payloadEncoded,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
        }

        function executeAuth(payload) {
            if (LOG_AUTH_DATA) {
                console.log('send', payload);
            }
            var payloadEncoded = $window.$.param(payload);

            return $http.post(
                API_LOCATION + '/oauth/token',
                payloadEncoded,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
        }

        function refresh() {
            // jshint camelcase:false
            var refreshToken = TokenHandler.getRefreshToken();

            if (!refreshToken) {
                console.log('No refresh token available.');
                $rootScope.$broadcast(INTELLOGO_EVENTS.LOGOUT);
                return;
            }

            var payload = {
                grant_type: 'refresh_token',
                client_id: getOauthClientId(),
                client_secret: getOauthClientSecret(),
                refresh_token: refreshToken
            };

            function handleRefreshFailure(err) {
                console.error(err);
                // TODO: Use events for signalling this.
                alert('Your session has expired !' +
                      ' Please reload the page');
            }

            executeAuth(payload)
                .success(function (data, status) {
                             if (status < 200 || status > 299) {
                                 handleRefreshFailure(
                                     'Could not get a refresh token. ' +
                                     'Probably there is a communication ' +
                                     'problem with the server?');
                             } else {
                                 handleResult(data);
                             }
                         })
                .error(handleRefreshFailure);
        }

        function loginWithPassword(username, password, force) {
            // jshint camelcase:false
            var payload = {
                username: username,
                password: password,
                grant_type: 'password',
                client_id: getOauthClientId(),
                client_secret: getOauthClientSecret()
            };

            if (force) {
                payload.forceLogin = force;
            }

            function handleAuthFailure (cause, status, payload) {
                $rootScope.$broadcast(INTELLOGO_EVENTS.AUTHENTICATION_FAILURE,
                                      cause, status, payload);
            }

            executeAuth(payload)
                .error(function (cause, status) {
                    handleAuthFailure(cause, status, payload);
                })
                .success(function (data, status) {
                             if (status < 200 || status > 299) {
                                 handleAuthFailure(
                                     'Could not log you in. ' +
                                     'Probably there is a communication ' +
                                     'problem with the server?');
                             } else {
                                 handleResult(data, true);
                             }
                         });
        }

        function loginWithClientCredentials() {
            // jshint camelcase:false
            var payload = {
                grant_type: 'client_credentials',
                client_id: getOauthClientId(),
                client_secret: getOauthClientSecret()
            };

            function handleAuthFailure(cause) {
                $rootScope.$broadcast(INTELLOGO_EVENTS.AUTHENTICATION_FAILURE,
                                      cause);
            }

            executeAuth(payload)
                .error(handleAuthFailure)
                .success(function (data, status) {
                    if (status < 200 || status > 299) {
                        handleAuthFailure(
                            'Could not log you in. ' +
                            'Probably there is a communication ' +
                            'problem with the server?');
                    } else {
                        handleResult(data, true);
                    }
                });
        }

        function logout() {
            var payload = {
                tokenToRevoke: TokenHandler.getToken()
            };
            TokenHandler.resetTokens();

            var failureMsg = 'Logout unsuccessful !';

            executeRevoke(payload)
                .error(_.partial(alert, failureMsg))
                .success(function (data, status) {
                             if (status < 200 || status > 299) {
                                 console.error(failureMsg);
                             }
                         });
        }

        function initializeRefresh() {
            var SECONDS_TO_REFRESH = 30,
                currentTimestamp = new Date().getTime(),
                tokenExpiration = TokenHandler.getTokenExpiration(),
                momentToRefresh = tokenExpiration - SECONDS_TO_REFRESH * 1000;

            if (!TokenHandler.getToken()) {
                // We don't have a token at all. Probably we should dispatch
                // a LOGOUT event here, in order to send the user to the login
                // page.
                return;
            }

            if (refreshTimer) {
                $timeout.cancel(refreshTimer);
            }

            if (!tokenExpiration || currentTimestamp >= momentToRefresh) {
                console.log('Access token expired.');
                $rootScope.$broadcast(INTELLOGO_EVENTS.LOGOUT);
                return;
            }

            console.log('Token valid until ' + new Date(tokenExpiration) +
                        '. Will refresh it at ' + new Date(momentToRefresh));
            var timeUntilExpiration = momentToRefresh - currentTimestamp;
            refreshTimer = $timeout(function () {
                console.log('Initiating token renewal. ' + new Date());
                refresh();
            }, timeUntilExpiration);
        }

        function isLoggedIn() {
            return TokenHandler.getTokenExpiration() > new Date().getTime();
        }

        return {
            setClientCredentials: setClientCredentials,
            loginWithPassword: loginWithPassword,
            loginWithClientCredentials: loginWithClientCredentials,
            logout: logout,
            initializeRefresh: initializeRefresh,
            refresh: refresh,
            isLoggedIn: isLoggedIn
        };
    });
