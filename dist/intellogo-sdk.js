'use strict';

angular.module('intellogoSDK', ['ngResource'])
    .config(["$httpProvider", function ($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    }])
    .run(["$rootScope", "INTELLOGO_EVENTS", "AuthService", function ($rootScope, INTELLOGO_EVENTS, AuthService) {
        $rootScope.$on(INTELLOGO_EVENTS.AUTHENTICATE_PASSWORD,
                       function (event, username, password, force) {
                           AuthService.loginWithPassword(username,
                                                         password,
                                                         force);
                       }
        );
        $rootScope.$on(INTELLOGO_EVENTS.AUTHENTICATE_CLIENT_SECRET,
                       function () {
                           AuthService.loginWithClientCredentials();
                       }
        );
        $rootScope.$on(INTELLOGO_EVENTS.LOGOUT,
                       function () {
                           AuthService.logout();
                       }
        );

        if (!(window.hasOwnProperty('TEST_MODE') && window.TEST_MODE)) {
            /*
             Do not refresh access tokens and stuff when running in a test
             runner.
             */
            AuthService.initializeRefresh();
        }
    }])
    .config(["$provide", function ($provide) {
        /*
         * This adds #success and #error methods to $q promises, to make
         * them look like regular HttpPromise objects.
         */
        $provide.decorator('$q', ["$delegate", function ($delegate) {
            var defer = $delegate.defer;
            $delegate.defer = function () {
                var deferred = defer();
                deferred.promise.success = function (fn) {
                    deferred.promise.then(_.ary(fn, 1));
                    return deferred.promise;
                };
                deferred.promise.error = function (fn) {
                    deferred.promise.then(null, _.ary(fn, 1));
                    return deferred.promise;
                };
                return deferred;
            };
            return $delegate;
        }]);
    }]);

'use strict';

(function () {
    angular.module('intellogoSDK')
        .constant('LOG_AUTH_DATA', false)
        .constant('INTELLOGO_API_LOCATION', 'https://production.intellogo.com')
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

'use strict';

/**
 * @ngdoc filter
 * @name intellogoSDK.filter:intellogoSourceLink
 * @function
 * @description
 * # sourceLinkFilter
 * When applied to an Intellogo content, returns the appropriate source URL from which
 * the content was imported into the Intellogo system. It may be a Wikipedia URL, a link to
 * a Project Gutenberg book, or a URL to one of the RSS feed sources Intellogo uses.
 */
angular.module('intellogoSDK').filter(
    'intellogoSourceLink',
    function () {
        return function (content) {
            function looksLikeAnUrl(string) {
                if (!_.isString(string)) {
                    return false;
                }
                return string.match(/^https?:\/\//);
            }

            function createUrl(source, sourceId) {
                // jshint maxcomplexity: 6
                var sourceIdLooksLikeAnUrl = looksLikeAnUrl(sourceId);
                if (source === 'Wikipedia') {
                    return 'https://en.wikipedia.org/?curid=' + sourceId;
                } else if (source === 'Project Gutenberg') {
                    return 'https://www.gutenberg.org/ebooks/' + sourceId;
                } else if (source.indexOf('Scribd', 0) === 0 ) {
                    return 'https://www.scribd.com/read/' + sourceId;
                } else if (sourceIdLooksLikeAnUrl) {
                    return sourceId;
                }
                return '';
            }

            var metadata = content.metadata;
            if (!metadata || !metadata.source) {
                return '';
            }

            return createUrl(metadata.source, metadata.sourceId);
        };
    });

/**
 * Holds various event names as constants.
 */
angular.module('intellogoSDK').constant(
    'INTELLOGO_EVENTS', {
        /**
         * The user should be authenticated.
         */
        AUTHENTICATE_PASSWORD: 'event:authenticatePassword',
        /**
         * The user should be authenticated with a client secret.
         */
        AUTHENTICATE_CLIENT_SECRET: 'event:authenticateClientSecret',
        /**
         * There has been a failure during authentication.
         */
        AUTHENTICATION_FAILURE: 'event:authenticationFailure',
        /**
         * The user has been successfully authenticated.
         */
        AUTHENTICATION_SUCCESS: 'event:authenticationSuccess',
        /**
         * The user has made a logout request.
         */
        LOGOUT: 'event:logout',
        /**
         * A smart folder has been added.
         */
        SMART_FOLDER_ADDED: 'event:smartFolderAdded',
        /**
         * A smart folder has been updated.
         */
        SMART_FOLDER_UPDATED: 'event:smartFolderUpdated',
        /**
         * A category has been updated.
         */
        CATEGORY_UPDATED: 'event:categoryUpdated'
    });

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
    ["$rootScope", "$http", "$window", "$timeout", "$injector", "TokenHandler", "IntellogoCredentials", "API_LOCATION", "LOG_AUTH_DATA", "INTELLOGO_EVENTS", function ($rootScope, $http, $window, $timeout, $injector, TokenHandler,
              IntellogoCredentials, API_LOCATION, LOG_AUTH_DATA, INTELLOGO_EVENTS) {
        var refreshTimer;

        function setClientCredentials(oauthClientId, oauthClientSecret) {
            IntellogoCredentials.setClientCredentials(oauthClientId, oauthClientSecret);
        }

        /**
         * Dynamically gets the OAuth client ID.
         * @return {String}
         */
        function getOauthClientId() {
            return IntellogoCredentials.getOauthClientId();
        }

        /**
         * Dynamically gets the OAuth client secret.
         * @return {String}
         */
        function getOauthClientSecret() {
            return IntellogoCredentials.getOauthClientSecret();
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
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.CaptionsService
 * @description
 * # CaptionsService
 * Factory in the rest.
 */
angular.module('intellogoSDK').factory(
    'CaptionsService', ["$http", "API_LOCATION", function ($http, API_LOCATION) {
        function getAllChannels() {
            return $http.get(API_LOCATION + '/api/captions/channels');
        }

        function deleteChannel(channel) {
            var filter = {
                source: 'Youtube',
                channelId: channel.id
            };

            return $http.post(API_LOCATION + '/api/contents/delete', {
                metadataFilter: filter
            });
        }

        return {
            deleteChannel: deleteChannel,
            getAllChannels: getAllChannels
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.CategoryService
 * @description
 * # CategoryService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
    'CategoryService',
    // jshint maxparams:5
    ["$http", "$rootScope", "API_LOCATION", "INTELLOGO_EVENTS", "ServiceUtils", function ($http, $rootScope, API_LOCATION, INTELLOGO_EVENTS, ServiceUtils) {
        // jshint maxstatements: 16
        /**
         * Retrieves all categories from the server.
         * @param {String} options.search Search term.
         * @param {String[]} options.statusFilter Filter categories by status.
         * @returns {HttpPromise} Resolved with the results.
         */
        function getAllCategories(options) {
            options = options || {};

            var parameters = {};

            if (options.search) {
                parameters.search = options.search;
            }

            if (options.statusFilter) {
                parameters.status = JSON.stringify(options.statusFilter);
            }

            var resultPromise = $http.get(ServiceUtils.constructServiceUrl(
                'categories',
                'all',
                ServiceUtils.constructQueryParameters(parameters)));

            return resultPromise;
        }

        function getCategoriesMetadata(categoryIds) {
             if (!_.isArray(categoryIds)) {
                categoryIds = [categoryIds];
            }
            var url = ServiceUtils.constructServiceUrl('categories', 'info');
            return $http.post(url, categoryIds);
        }

        function getCategoriesCount() {
            return $http.get(API_LOCATION + '/api/categories/count');
        }

        function getCategoriesRestrictions() {
            return $http.get(API_LOCATION + '/api/categories/restrictions');
        }

        function convertToContentUpdate(categories) {
            return _.map(categories, function (category) {
                return {
                    categoryId : category.categoryId,
                    samples    : category.samples || [],
                    testSamples: category.testSamples || []
                }; });
        }

        /**
         * Associates contents with categories. The contents that should be
         * assigned to a category need to be added as regular entries in the
         * "samples" array of the respective category object.
         * @param {Object[]} categories The target categories.
         * @returns {HttpPromise}
         */
        function associateContentsWithCategory(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            // filter unneeded fields
            return $http.post(API_LOCATION + '/api/categories/assign',
                              convertToContentUpdate(categories));
        }

        /**
         * Deassociates contents with categories. The contents that should be
         * removed from a category need to be removed as entries in the
         * "samples" array of the respective category object.
         * @param {Object[]} categories The target categories.
         * @returns {HttpPromise} Will be resolved when the request has
         * finished.
         */
        function deAssociateContentsWithCategory(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            // filter unneeded fields
            return $http.post(API_LOCATION + '/api/categories/unassign',
                              convertToContentUpdate(categories));
        }

        /**
         * Creates categories on the server. The IDs will be returned when the
         * request is finished.
         * @param {String[]} categoryNames The names of the categories to add.
         * @returns {HttpPromise} Will be resolved when the request has
         * finished.
         */
        function addNewCategories(categoryNames) {
            if (!_.isArray(categoryNames)) {
                categoryNames = [categoryNames];
            }
            var categories = _.map(categoryNames, function (name) {
                return {
                    name: name
                };
            });
            return $http.post(API_LOCATION + '/api/categories/create',
                              categories);
        }

        /**
         * Updates a changed category. Do not use this for adding or removing
         * samples (contents) to/from the category.
         * @param {Object} category The modified category object.
         * @returns {HttpPromise} Will be resolved when the request has
         * finished.
         */
        function saveCategoryChanges(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }

            var response = $http.post(API_LOCATION + '/api/categories/update',
                                      categories);
            response.success(function() {
                $rootScope.$broadcast(INTELLOGO_EVENTS.CATEGORY_UPDATED);
            });
            return response;
        }

        /**
         * Removes categories from the server.
         * @param {Object[]} categories The target category objects.
         * @returns {HttpPromise}
         */
        function removeCategories(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            categories = _.pluck(categories, 'categoryId');
            return $http.post(API_LOCATION + '/api/categories/delete',
                              categories);
        }

        /**
         *
         * @param {String} categoryId The ID of the category.
         * @param {Number} [count] the number of URLs to be returned
         * @returns {HttpPromise}
         */
        function getCategoryImages(categoryId, count) {
            var obj = {
                id: categoryId
            };

            if (angular.isDefined(count)) {
                obj.count = count;
            }
            return $http.get(API_LOCATION + '/api/categories/contentImages' +
                ServiceUtils.constructQueryParameters(obj));
        }

        /**
         * Retrieves all contents in collection with given name
         * that are part of a category. Will include
         * contents that are added as negative samples.
         * @param {String} categoryId The ID of the category.
         * @param {String} collectionName The name of the contents collection.
         * @returns {HttpPromise}
         */
        function getContentsInCategory(categoryId, collectionName) {
            return $http.post(API_LOCATION + '/api/categories/contents',
                              [
                                  {
                                      categoryId: categoryId,
                                      metadata: true,
                                      collectionName: collectionName
                                  }
                              ]);
        }


        function getDynamicCategories (searchTerm, metadata) {
            metadata = metadata ? metadata: {};
            return $http.post(
                ServiceUtils.constructServiceUrl('categories', 'dynamic'),
                {
                    searchTerm : searchTerm,
                    displayName: metadata.displayName,
                    description: metadata.description,
                    numResults : metadata.numResults
                }
            );
        }

        /**
         * Invalidates categories on the server side. This means that all data
         * associated with the categories (trainings, ratings, etc.) will be
         * removed, but the categories themselves will remain intact.
         * @param {Object[]} categories The category objects.
         * @return {HttpPromise}
         */
        function invalidateCategories(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            return $http.post(API_LOCATION + '/api/categories/invalidate',
                              categories);
        }

        /**
         *
         * Saves the changes made. Has five main responsibilities:
         * 1. If there are newly added categories, create them on the server
         *    side. Save their IDs for the next step.
         * 2. Save the changes to any modified categories.
         * 3. Associate all newly added contents with the target categories.
         * 4. Associate all existing contents with the target categories. (e.g.
         * when changing from positive to negative)
         * 5. Remove any existing contents which have been removed as samples
         * from the categories.
         * @param {Array<Object>|Object} categoriesForSaving
         * @param {Object} originalCategoriesData
         * @param callback
         */
        function saveCategoryDataChanges(categoriesForSaving,
                                         originalCategoriesData,
                                         callback) {
            if (!categoriesForSaving) {
                callback(new Error('Categories not selected'));
            }

            if(!_.isArray(categoriesForSaving)) {
                categoriesForSaving = [categoriesForSaving];
            }

            function isCategoryNew(category) {
                return !category.categoryId;
            }

            var newlyAddedCategories =
                _.filter(categoriesForSaving,
                         isCategoryNew);


            function shouldInvalidate(category) {
                category = _.clone(category);
                delete category.categoryId;
                var invalidate = !_.find(newlyAddedCategories, category) &&
                   (category.newContents && category.newContents.length ||
                    category.dirtySamples && category.dirtySamples.length ||
                    category.removedSamples && category.removedSamples.length);
                return !!invalidate;
            }

            function processContentForSaving(content) {
                return {
                    contentId: content._id || content.contentId,
                    positive: content.positive
                };
            }

            /**
             * Creates new categories if the user has added any from the UI.
             * @param callback
             */
            function createNewCategoriesIfNecessary(callback) {
                if (newlyAddedCategories.length > 0) {
                    var namesOfCategoriesForCreation =
                        _.pluck(newlyAddedCategories, 'name');
                    addNewCategories(
                        namesOfCategoriesForCreation)
                        .success(
                        function (savedCategories) {
                            _.each(savedCategories, function (category, index) {
                                newlyAddedCategories[index].categoryId =
                                    category._id;
                            });
                            callback();
                        });
                } else {
                    callback();
                }
            }

            /**
             * Assigns new samples to categories.
             * @param callback
             */
            function assignNewSamples(callback) {
                var categoriesWithNewItems =
                    _.filter(categoriesForSaving,
                        function (category) {
                            return (category.newContents &&
                                category.newContents.length) ||
                                (category.newTestContents &&
                                category.newTestContents.length);
                        });
                var parameters =
                    _.map(categoriesWithNewItems,
                        function (category) {
                            var samples =
                                _.map(category.newContents,
                                    processContentForSaving);
                            var testSamples =
                                _.map(category.newTestContents,
                                    processContentForSaving);
                            return {
                                categoryId: category.categoryId,
                                samples: samples,
                                testSamples: testSamples,
                                invalidate: shouldInvalidate(category)
                            };
                        });

                if (!parameters.length) {
                    callback();
                    return;
                }
                associateContentsWithCategory(parameters)
                    .success(function () {
                        callback();
                    });
            }

            /**
             * Re-assigns existing samples in categories. (e.g. when a sample is
             * changed from positive to negative)
             * @param callback
             */
            function assignExistingSamples(callback) {
                var categoriesWithChangedItems =
                    _.filter(categoriesForSaving,
                        function (category) {
                            return (category.dirtySamples &&
                                category.dirtySamples.length) ||
                                (category.dirtyTestSamples &&
                                category.dirtyTestSamples.length);
                        });
                var parameters =
                    _.map(categoriesWithChangedItems,
                        function (category) {
                            var samples =
                                _.map(category.dirtySamples,
                                    processContentForSaving);
                            var testSamples =
                                _.map(category.dirtyTestSamples,
                                    processContentForSaving);
                            return {
                                categoryId: category.categoryId,
                                samples: samples,
                                testSamples: testSamples,
                                invalidate: shouldInvalidate(category)
                            };
                        });
                if (!parameters.length) {
                    callback();
                    return;
                }
                associateContentsWithCategory(parameters)
                    .success(function () {
                        callback();
                    });
            }

            /**
             * Removes samples associated with existing categories.
             * @param callback
             */
            function removeExistingSamples(callback) {
                var categoriesWithRemovedItems =
                    _.filter(categoriesForSaving,
                        function (category) {
                            return (category.removedSamples &&
                                category.removedSamples.length) ||
                                (category.removedTestSamples &&
                                category.removedTestSamples.length);
                        });
                var parameters =
                    _.map(categoriesWithRemovedItems,
                        function (category) {
                            var samples =
                                _.map(category.removedSamples,
                                    processContentForSaving);
                            var testSamples =
                                _.map(category.removedTestSamples,
                                    processContentForSaving);
                            return {
                                categoryId: category.categoryId,
                                samples: samples,
                                testSamples: testSamples,
                                invalidate: shouldInvalidate(category)
                            };
                        });
                if (!parameters.length) {
                    callback();
                    return;
                }

                deAssociateContentsWithCategory(parameters)
                    .success(function () {
                        callback();
                    });
            }

            /**
             * Edits existing categories which have been changed (e.g., from
             * the name field) in the UI.
             * @param callback
             */
            function updateCategoriesMetadata(callback) {
                var updateMetadataFields = [
                    'name', 'description', 'autoupdate', 'displayName', 'productionReady',
                    'locked', 'useTSVD', 'tags', 'keywords', 'userTrained'
                ];
                var categoriesWithChanges =
                    _(categoriesForSaving)
                        .filter(function (category) {
                            var originalCategory =
                                originalCategoriesData[category.categoryId],
                                categoryNewlyAdded =
                                    newlyAddedCategories.indexOf(category) >= 0,
                                categoryChanged =
                                    !(_.isEqual(category, originalCategory));
                            return categoryChanged || categoryNewlyAdded;
                        })
                        .map(function (category) {
                            var originalCategory =
                                originalCategoriesData[category.categoryId];

                            function isFieldUnchanged(val, key) {
                                return _.isEqual(originalCategory && originalCategory[key],
                                                 val);
                            }

                            // leave only changed fields
                            var categoryChanges =
                                _(category)
                                    .pick(updateMetadataFields)
                                    .omit(isFieldUnchanged)
                                    .value();

                            if (_.isEmpty(categoryChanges)) {
                                // nothing to update ...
                                return null;
                            }

                            categoryChanges.categoryId = category.categoryId;
                            return categoryChanges;
                        })
                        .compact()
                        .value();

                if (!categoriesWithChanges.length) {
                    callback();
                    return;
                }

                async.each(categoriesWithChanges,
                    function (category, asyncCallback) {
                        saveCategoryChanges(category)
                            .success(function () {
                                asyncCallback(null);
                            })
                            .error(function (error) {
                                asyncCallback(error || 'Error');
                            });
                    },
                    callback);
            }

            async.series([
                    createNewCategoriesIfNecessary,
                    updateCategoriesMetadata,
                    assignNewSamples,
                    assignExistingSamples,
                    removeExistingSamples
                ], _.partial(callback, _, newlyAddedCategories));
        }

        return {
            addNewCategories                 : addNewCategories,
            associateContentsWithCategory    : associateContentsWithCategory,
            deAssociateContentsWithCategory  : deAssociateContentsWithCategory,
            getAllCategories                 : getAllCategories,
            getCategoriesMetadata            : getCategoriesMetadata,
            getCategoryImages                : getCategoryImages,
            getCategoriesCount               : getCategoriesCount,
            getCategoriesRestrictions        : getCategoriesRestrictions,
            getDynamicCategories             : getDynamicCategories,
            expandContentsInCategory         : getContentsInCategory,
            removeCategories                 : removeCategories,
            /**
             * @deprecated Use #deAssociateContentsWithCategory instead.
             */
            removeContentsFromCategory  : deAssociateContentsWithCategory,
            saveCategoryChanges         : saveCategoryChanges,
            saveCategoryDataChanges     : saveCategoryDataChanges,
            invalidateCategories        : invalidateCategories
        };
    }]);

'use strict';

angular.module('intellogoSDK')
    .factory('ClientService', ['$resource', 'ServiceUtils',
        function ($resource, ServiceUtils) {
            return $resource(
                ServiceUtils.constructServiceUrl('clients', ':id'),
                {id: '@_id'},
                {
                    /**
                     * Convenience method for retrieving information about
                     * the currently authenticated client
                     */
                    me: {
                        method: 'GET',
                        url: ServiceUtils.constructServiceUrl('clients', 'me')
                    }
                }
            );
        }
    ]);

'use strict';

angular.module('intellogoSDK')
    .factory('ContentGroupsService', ['$resource', 'ServiceUtils',
        function ($resource, ServiceUtils) {
            return $resource(
                ServiceUtils.constructServiceUrl('contentGroups', ':id'),
                {id: '@_id'}, // non-GET
                {
                    'resolveIncludedSources': {
                        method: 'GET',
                        url: ServiceUtils.constructServiceUrl('contentGroups', 'resolved'),
                        isArray: true,
                        params: {name: []}
                    }
                }
            );
        }
    ]);

'use strict';

/**
 * @ngdoc service
 * @name rest.ContentService
 * @description
 * # ContentService
 * Factory in the rest.
 */
angular.module('intellogoSDK').factory(
    'ContentService', ["$http", "ServiceUtils", function ($http, ServiceUtils) {
        // jshint maxstatements: 21
        /**
         * Returns contents from categories.
         * @param from Where to start in the results (for pagination).
         * @param to Where to end in the results (for pagination).
         * @param {Object} options The options to use.
         * @param {String} options.search Search criteria for content titles
         * and author.
         * @param {String} options.source Content source to use for filtering
         * the contents.
         * @param {Array} options.channelId A list of channelIds to match.
         * Should only be used when <code>options.source === 'Youtube'</code>
         * @param {Number} options.acquisitionDate A timestamp used for
         * filtering. Only content items acquired after it will be returned.
         * @returns {HttpPromise}
         */
        function getAllContentsInCategories(from, to, options) {
            options = options || {};

            var url             = ServiceUtils.constructServiceUrl('contents', 'all'),
                queryParameters = {from: from, to: to};

            function setSearch() {
                var search = options.search;
                if (search) {
                    queryParameters.search = search;
                }
            }

            function setSource() {
                var source = options.source;
                if (source) {
                    queryParameters.source = source;
                }
            }

            function setChannelId() {
                if (options.channelId && options.channelId.length) {
                    if (!queryParameters.metadataFilter) {
                        queryParameters.metadataFilter = {};
                    }
                    queryParameters.metadataFilter.channelId =
                        options.channelId;
                }
            }

            function setAcquistionDate() {
                if (options.acquisitionDate) {
                    if (!queryParameters.metadataFilter) {
                        queryParameters.metadataFilter = {};
                    }
                    queryParameters.metadataFilter.acquisitionDate =
                        options.acquisitionDate;
                }

            }

            setSearch();
            setSource();
            setChannelId();
            setAcquistionDate();
            url += ServiceUtils.constructQueryParameters(queryParameters);

            return $http.get(url);
        }

        function updateContentUsers(contentId, userIds) {
            return $http.post(ServiceUtils.constructServiceUrl('contents/users', 'update'),
                {
                    contentId: contentId,
                    userIds  : userIds
                });
        }

        /**
         * Retrieve all contents that match the given sourceId
         * (from any available source).
         * @param {String/Number} sourceId The source id of the item.
         * @returns {HttpPromise}
         */
        function getContentsBySourceId(sourceId) {
            return $http.post(ServiceUtils.constructServiceUrl('contents', 'contentsBySourceId'),
                              {sourceId: sourceId});
        }

        /**
         * Saves changes made in a content.
         * @param {Object} content The target content.
         * @returns {HttpPromise}
         */
        function getContentsByIds(contentIds) {
            //jshint maxlen:87
            var contents = _.map(contentIds, function (id) {
                return {contentId: id};
            });
            return $http.post(ServiceUtils.constructServiceUrl('contents/metadata', 'all'),
                              contents);
        }

        /**
         * Removes contents from the database.
         * @param {Object[]} contents The target content objects.
         * @returns {*|{}}
         */
        function removeContents(contents) {
            if (!_.isArray(contents)) {
                contents = [contents];
            }
            var parameters = _.map(contents, function (content) {
                return {
                    contentId: content._id
                };
            });
            return $http.post(ServiceUtils.constructServiceUrl('contents', 'delete'),
                              parameters);
        }

        function removeContentTree(content) {
            var params = {contentId: content._id};
            return $http.post(
                ServiceUtils.constructServiceUrl('contents', 'deleteTree'),
                params);
        }

        /**
         * Retrieves all available content sources from the server.
         * @returns {HttpPromise}
         */
        function getAllContentSources() {
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'sources'));
        }

        function getContentsRestrictions() {
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'restrictions'));
        }

        function getContentsCount() {
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'count'));
        }

        /**
         * Imports articles by their URLs. This will trigger server-side
         * ingestion which includes articles pre-processing (e.g. finding their
         * most relevant elements), invoking fingerprinters and adding them
         * to the database.
         * @param {Array} articles The article objects {url, source}
         * @return {HttpPromise} Resolved once the ingestion is complete. Keep
         * in mind that it may take some time for the content to be processed.
         */
        function importArticles(articles) {
            return $http.post(ServiceUtils.constructServiceUrl('contents', 'importArticles'),
                              {dataForImport: articles});
        }

        /**
         * Imports channel videos captions by channel id. This will trigger
         * server-side ingestion which includes articles pre-processing
         * (e.g. finding their most relevant elements),
         * invoking fingerprinters and adding them to the database.
         * @param {String} importOptions.channelUrl The channel URL
         * @param {Boolean} importOptions.autoSub Import videos with automatic captions
         * @param {Boolean} importOptions.enableCaptionsChunking Whether captions for a single video
         * should be split in parts, to be analysed separately
         * @param {Number} importOptions.chunkSize The size (in characters) for each chunk part
         * @return {HttpPromise} Resolved once the ingestion is complete. Keep
         * in mind that it may take some time for the content to be processed.
         */
        function importCaptions(channelUrl, importOptions) {
            var params = _.clone(importOptions);
            params.channel = channelUrl;
            return $http.post(
                ServiceUtils.constructServiceUrl('contents', 'initiateChannelImportTask'),
                params);
        }

        function getFullTaskStatus(taskId) {
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'taskStatus'), {
                params: {taskId: taskId}
            });
        }

        /**
         * Returns the status with payload of the current training.
         * @returns {HttpPromise}
         */
        function getStatusWithPayload(timeInterval) {
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'statusWithPayload'), {
                params: {timeInterval: timeInterval}
            });
        }

        function getAllTopLevelContents(from, to, options) {
            var query = {from: from, to: to};
            if (options.search) {
                query.search = options.search;
            }
            if (options.source) {
                query.source = options.source;
            }
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'topLevel') +
                             ServiceUtils.constructQueryParameters(query));
        }

        function getContentDescendants(contentId) {
            var params = {
                contentId: contentId
            };
            return $http.get(ServiceUtils.constructServiceUrl('contents', 'tree') +
                             ServiceUtils.constructQueryParameters(params));
        }

        function updateContentTreeMetadata(contentId, newMetadata) {
            var params = {
                contentId: contentId,
                metadata : newMetadata
            };
            return $http.post(ServiceUtils.constructServiceUrl('contents/tree', 'metadata'),
                              params);
        }

        function getCaptionsFileImportEndpoint() {
            return ServiceUtils.constructServiceUrl('contents', 'importSubtitles');
        }

        function getEpubImportEndpoint() {
            return ServiceUtils.constructServiceUrl('contents', 'importEpub');
        }

        function getImportArticlesEndpoint() {
            return ServiceUtils.constructServiceUrl('contents',
                                                    'importArticlesXls');
        }

        function getIngestedContentBySources(sources, timeInterval) {
            return $http.post(
                ServiceUtils.constructServiceUrl('contents',
                                                 'ingestedBySource'),
                {
                    /* set to seconds timestamp */
                    from   : Math.floor(timeInterval.from / 1000),
                    to     : Math.floor(timeInterval.to / 1000),
                    sources: sources
                });
        }

        function getBlacklistedContentBySources(sources, timeInterval) {
            return $http.post(
                ServiceUtils.constructServiceUrl('contents',
                                                 'blacklistedBySource'),
                {
                    /* set to seconds timestamp */
                    from   : Math.floor(timeInterval.from / 1000),
                    to     : Math.floor(timeInterval.to / 1000),
                    sources: sources
                });
        }

        return {
            getAllContentSources          : getAllContentSources,
            getAllContentsInCategories    : getAllContentsInCategories,
            getAllTopLevelContents        : getAllTopLevelContents,
            getCaptionsFileImportEndpoint : getCaptionsFileImportEndpoint,
            getContentDescendants         : getContentDescendants,
            getContentsByIds              : getContentsByIds,
            getContentsBySourceId         : getContentsBySourceId,
            getContentsCount              : getContentsCount,
            getIngestedContentBySources   : getIngestedContentBySources,
            getBlacklistedContentBySources: getBlacklistedContentBySources,
            getContentsRestrictions       : getContentsRestrictions,
            getEpubImportEndpoint         : getEpubImportEndpoint,
            getImportArticlesEndpoint     : getImportArticlesEndpoint,
            getStatusWithPayload          : getStatusWithPayload,
            getFullTaskStatus             : getFullTaskStatus,
            importArticles                : importArticles,
            importCaptions                : importCaptions,
            removeContentTree             : removeContentTree,
            removeContents                : removeContents,
            updateContentTreeMetadata     : updateContentTreeMetadata,
            updateContentUsers            : updateContentUsers
        };
    }]);

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

'use strict';

angular.module('intellogoSDK')
    .factory('EndpointService', ['$resource', 'ServiceUtils',
        function ($resource, ServiceUtils) {
            return $resource(
                ServiceUtils.constructServiceUrl('admin', 'endpoints/:id'),
                {id: '@_id'},
                {}
            );
        }
    ]);

'use strict';

/**
 * @ngdoc service
 * @name rest.FeedSourcesService
 * @description
 * # FeedSourcesService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
    'FeedSourcesService',
    ["$http", "API_LOCATION", function ($http, API_LOCATION) {
        function getSourcesEndpoint(service) {
            return API_LOCATION + '/api/feedSources/' + service;
        }

        function getSources() {
            return $http.get(getSourcesEndpoint(''));
        }

        function addSource(source) {
            return $http.post(getSourcesEndpoint('add'), source);
        }

        function updateSource(source) {
            return $http.post(getSourcesEndpoint('update'), source);
        }

        function removeSource(sourceId) {
            return $http.delete(getSourcesEndpoint(sourceId));
        }

        function collectFeeds(url) {
            return $http.post(getSourcesEndpoint('collect'), { url: url });
        }

        return {
            getSources: getSources,
            addSource: addSource,
            updateSource: updateSource,
            removeSource: removeSource,
            collectFeeds: collectFeeds
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.fileDownloadDialogService
 * @description
 * # fileDownloadDialogService
 * Service in the rest.
 */
angular.module('intellogoSDK').service(
    'FileDownloadDialogService',
    ["UrlUtils", "$window", function (UrlUtils, $window) {
        function downloadFileInNewWindow(url) {
            $window.open(UrlUtils.addAccessTokenToUrl(url));
        }

        return {
            downloadFileInNewWindow: downloadFileInNewWindow
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.AuthInterceptor
 * @description
 * # AuthInterceptor
 * Intercepts AJAX requests to implement authentication. Does two main things:
 * - adds proper access tokens to requests
 * - monitors error responses in order to catch 401s and redirect the user to
 *   the login page if necessary
 * @see AuthService
 */
angular.module('intellogoSDK').factory(
    'AuthInterceptor', ["UrlUtils", "$location", "$q", "TokenHandler", function (UrlUtils, $location, $q, TokenHandler) {
        return {
            request: function (config) {
                function isTokenNeeded(url) {

                    return url.indexOf('views/') !== 0 &&
                        url.indexOf('.html') <= 0 &&
                        url.indexOf('.svg') <= 0;
                }

                if (isTokenNeeded(config.url)) {
                    config.url = UrlUtils.addAccessTokenToUrl(config.url);
                }
                return config;
            },
            responseError: function (config) {
                // On localhost the status is 0. Unfortunately, we can get
                // status 0 in many other situations (e.g. reloading when an
                // AJAX request is running).
                if (config.status === 401) {
                    console.log('Unauthorized, redirecting to login page.');
                    
                    // clear expired token
                    TokenHandler.resetTokens();
                    
                    $location.path('/login');
                }
                return $q.reject(config);
            }
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.LiveConfigService
 * @description
 * # LiveConfigService
 * Services for loading and updating the server configuration.
 */
angular.module('intellogoSDK')
    .factory(
    'LiveConfigService',
    ["$http", "API_LOCATION", function ($http, API_LOCATION) {
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
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.localStorageBackedVariable
 * @description
 * # localStorageBackedVariable
 * Service in the rest.
 */
angular.module('intellogoSDK').factory(
    'LocalStorageBackedVariable',
    function () {
        function createTesting() {
            var _value;
            return {
                getValue: function () {
                    return _value;
                },
                setValue: function (value) {
                    _value = value;
                }
            };
        }

        function stringifyValue(value) {
            if (value !== undefined) {
                return JSON.stringify(value);
            }
            return '';
        }

        function parseValue(value) {
            if (value && value !== '') {
                var result;
                try {
                   result = JSON.parse(value);
                } catch (e) {
                    // the old value is not valid JSON and probably
                    // was generated before adding the parse
                    result = value;
                }
                return result;
            }
            return undefined;
        }

        function create(name) {
            var _value = localStorage.getItem(name);
            _value = parseValue(_value);
            return {
                getValue: function () {
                    return _value;
                },
                setValue: function (value) {
                    var strValue = stringifyValue(value);
                    if (stringifyValue(_value) !== strValue) {
                        localStorage.setItem(name, strValue);
                    }
                    _value = value;
                }
            };
        }

        function isInTestingMode() {
            return window.hasOwnProperty('TEST_MODE') && window.TEST_MODE;
        }

        return {
            createHolder: function () {
                if (isInTestingMode()) {
                    return createTesting.apply(this, arguments);
                } else {
                    return create.apply(this, arguments);
                }
            }
        };
    });

'use strict';

/**
 * @ngdoc service
 * @name rest.RatingService
 * @description
 * # RatingService
 * Services for ratings manipulation.
 */
angular.module('intellogoSDK')
    .factory(
    'RatingService',
    ["$http", "ServiceUtils", "FileDownloadDialogService", function ($http, ServiceUtils, FileDownloadDialogService) {
        // jshint maxparams:6, maxstatements: 18

        function getRatingsEndpoint(service) {
            return ServiceUtils.constructServiceUrl('rating', service);
        }

        /**
         * Gets ratings from the server.
         * @param {string} categoryId filter by category ID.
         * @param {Object} parameters Parameters.
         * @param {string} [parameters.runId] An ID of run to use
         * for content filtering of the ratings.
         * @param {string[]} [parameters.source] Optional filter by source
         * @param {string[]} [parameters.sourceGroups] Optional filter
         * by sourceGroup
         * @param {number} [parameters.date] Acquisition date
         * @param {number} [parameters.from] Start of the "slice" to show.
         * @param {number} [parameters.to] End of the "slice" to show.
         * @returns {HttpPromise}
         */
        function getRatings(categoryId, parameters) {
            if (_.isArray(categoryId)) {
                throw new Error('Only one category is supported.');
            }

            var queryParameters = {
                categoryId: categoryId,
                content: {
                    source: parameters.source,
                    sourceGroup: parameters.sourceGroups,
                    acquisitionDate: parameters.date
                },
                runId: parameters.runId,
                from: parameters.from,
                to: parameters.to
            };

            if (parameters.channelId && parameters.channelId.length) {
                queryParameters.content.channelId = parameters.channelId;
            }
            var url = getRatingsEndpoint('categoryBest') +
                ServiceUtils.constructQueryParameters(queryParameters);

            return $http.get(url);
        }

        /**
         * Gets ratings from the server in a CSV format.
         * @param {string} category Filter by category ID.
         * @returns {HttpPromise}
         */
        function getRatingsAsCSV(category, source) {
            if (_.isArray(category)) {
                throw new Error('Only one category is supported.');
            }

            var queryParams = {
                categoryId : category
            };

            if (source) {
                queryParams.source = source;
            }

            var url = getRatingsEndpoint('categoryBestCSV') +
                ServiceUtils.constructQueryParameters(
                    queryParams);

            FileDownloadDialogService.downloadFileInNewWindow(url);
        }

        /**
         * Removes ratings from the server.
         * @param ratings The ratings objects. Should contain an "_id" field.
         * @returns {HttpPromise}
         */
        function removeRatings(ratings) {
            if (!_.isArray(ratings)) {
                ratings = [ratings];
            }

            var parameters = _.map(ratings, function (rating) {
                return {
                    ratingId: rating._id
                };
            });

            return $http.post(getRatingsEndpoint('delete'),
                              parameters);
        }

        function extractSmartFolderItemData(item) {
            var value = item.value || [0, 100],
                min = value[0],
                max = value[1],
                queryObject = {
                    min: min,
                    max: max
                };

            if (item.categoryId) {
                queryObject.categoryId = item.categoryId;
            } else if (item.contentId) {
                queryObject.contentId = item.contentId;
            } else {
                queryObject = { error: 'Item doesn\'t ' +
                'contain any id!'};
            }

            return queryObject;
        }
        /**
         * Returns the ratings for a smart folder (e.g. a set of categories with
         * confidence score ranges).
         * @param {{categoryId: string, value: number[]}|
         * {contentId: string, value: number[]}} smartFolder
         * The smart folder that should be used for filtering.
         * @param {Boolean} useSmartFolderCache Whether to use
         * cached results for the smart folder.
         * @param {String} smartFolderCacheType Which type of cache to use. Supported types are
         * 'newest' and 'best'.
         * @param {Object} filters
         * @param {string[]} [filters.recommendationSources] filter by sources
         * @param {string[]} [filters.sourceGroups] Filter by content source group (e.g. web, books)
         * @param {Number} [filters.acquisitionDate] Only content created after this timestamp
         * will be matched
         * @param {String} [filters.channelId] Youtube only. If searching for matching Youtube
         * videos, narrows the results down to matches only from the specified Youtube channel.
         * @param {number} [from] Start of the "slice" to show.
         * @param {number} [to] Start of the "slice" to show.
         * @returns {HttpPromise}
         */
        function getRatingsForSmartFolder(smartFolder,
                                          useSmartFolderCache,
                                          smartFolderCacheType,
                                          filters,
                                          from,
                                          to) {

            var queryParameters = buildRatingParams(smartFolder,
                                                    useSmartFolderCache,
                                                    smartFolderCacheType,
                                                    filters,
                                                    from, to);

            var url = ServiceUtils.constructServiceUrl(
                'smartFolders',
                'ratings',
                ServiceUtils.constructQueryParameters(queryParameters));

            return $http.get(url);
        }

        function getRatingsForSmartFolderCSV(smartFolder,
                                             useSmartFolderCache,
                                             smartFolderCacheType,
                                             options,
                                             from,
                                             to) {

            var queryParameters = buildRatingParams(smartFolder,
                                                    useSmartFolderCache,
                                                    smartFolderCacheType,
                                                    options,
                                                    from, to);
            var url = ServiceUtils.constructServiceUrl(
                'smartFolders',
                'ratingsCSV',
                ServiceUtils.constructQueryParameters(queryParameters));

            FileDownloadDialogService.downloadFileInNewWindow(url);
        }

        function buildRatingParams(smartFolder,
                                   useSmartFolderCache,
                                   smartFolderCacheType,
                                   filters,
                                   from, to) {
            function applyFilter(queryParameters) {
                var metadataFilter = {};

                metadataFilter = _.pick(filters, [
                    'recommendationSources',
                    'sourceGroups',
                    'acquisitionDate',
                    'channelId'
                ]);
                if (metadataFilter.recommendationSources) {
                    // rename field
                    metadataFilter.source = metadataFilter.recommendationSources;
                    delete metadataFilter.recommendationSources;
                }

                if (metadataFilter.sourceGroups) {
                    metadataFilter.sourceGroup = metadataFilter.sourceGroups;
                    delete metadataFilter.sourceGroups;
                }

                if (!_.isEmpty(metadataFilter)) {
                    queryParameters.metadataFilter = metadataFilter;
                }
            }

            var queryParameters,
                smartFolderId = smartFolder._id;
            if (useSmartFolderCache) {
                queryParameters = {
                    smartFolderId: smartFolderId,
                    useCache: true,
                    cacheType: smartFolderCacheType
                };
            } else {
                var smartFolderParameters = _.map(smartFolder.items, extractSmartFolderItemData);
                queryParameters = {
                    smartFolderItem: smartFolderParameters
                };
            }

            applyFilter(queryParameters);

            queryParameters.from = from;
            queryParameters.to = to;

            return queryParameters;
        }

        /**
         * Returns the number of the available recommendations for a given
         * smart folder
         * @param {{categoryId: string, value: number[]} |
                   {contentId: string, value: number[]}} smartFolder
         * The smart folder that should be used for filtering.
         * @returns {HttpPromise}
         */
        function countRatingsForSmartFolder(smartFolder,
                                            useSmartFolderCache,
                                            smartFolderCacheType,
                                            options) {
            var queryParameters = buildRatingParams(smartFolder,
                                                    useSmartFolderCache,
                                                    smartFolderCacheType,
                                                    options);

            var url = ServiceUtils.constructServiceUrl(
                'smartFolders',
                'ratingsCount',
                ServiceUtils.constructQueryParameters(queryParameters));

            return $http.get(url);
        }

        /**
         * Counts the ratings for a smart folder (e.g. a set of categories with
         * confidence score ranges). Will return the number of items in each
         * category.
         * @param {{categoryId/contentId: string, value: number[]}} smartFolder
         * The smart folder that should be used for counting.
         * @returns {HttpPromise}
         */
        function countIndividualRatingsForSmartFolder(smartFolder) {

            var queryParameters = buildRatingParams(smartFolder);

            var url = ServiceUtils.constructServiceUrl(
                'smartFolders',
                'ratingsCountIndividual',
                ServiceUtils.constructQueryParameters(queryParameters));

            return $http.get(url);
        }

        /**
         * Returns the category ratings for a specific content.
         * @param {String} contentId The content ID.
         * @param {Boolean} [productionReady]
         *                 Whether to include only production ready categories.
         * @param {Number} [from]
         *                 The beginning of the requested range of ratings.
         * @param {Number} [to]
         *                 The end of the requested range of ratings.
         * @param {Number} [minScore]
         *                 The minimum score that the ratings should have.
         * @return {HttpPromise}
         */
        function getCategoryRatingsForContent(contentId, productionReady,
                                              from, to, minScore) {
            var queryParameters = {
                contentId: contentId
            };
            if (angular.isDefined(productionReady) &&
                productionReady !== null) {
                queryParameters.productionReady = productionReady;
            }
            if (angular.isNumber(from)) {
                queryParameters.from = from;
            }
            if (angular.isNumber(to)) {
                queryParameters.to = to;
            }
            if (angular.isNumber(minScore)) {
                queryParameters.minScore = minScore;
            }

            var url = getRatingsEndpoint('contentCategoryRatings') +
                ServiceUtils.constructQueryParameters(queryParameters);

            var response = $http.get(url).success(function (ratings) {
                _.each(ratings, function (rating) {
                    if (rating.category) {
                        rating.tags =
                            rating.category.tags;
                    }
                });
            });

            return response;
        }

        /**
         * Retrieves the categories map the the profile's contents by
         * either <code>profileId</code> of <code>contentIds</code>
         * of the profile.
         * @param [profileId] {String}
         * @param [contentIds] {Array<String>}
         * @param [minScore]
         * @returns {HttpPromise}
         */
        function getCategoryRatingMapForContents(profileId,
                                                 contentIds,
                                                 minScore,
                                                 productionReady) {
            var params = {
                    productionReady: productionReady,
                    minScore: minScore
                },
                apiUrl = ServiceUtils.constructServiceUrl('rating', 'contentsCategoryRatingsMap');

            if (profileId) {
                params.profileId = profileId;
            } else {
                params.contentIds = contentIds;
            }

            var response = $http.post(apiUrl, params);

            return response;
        }

        /**
         * Returns the content ratings for a specific content.
         * @param {Object} params Parameters
         * @param {String} [params.contentId] The content ID.
         * @param {String[]} [params.recommendationsSource] An optional
         * filter by source
         * @param {Object[]} [parameters.itemsToRate] an array with objects
         * of type {source: s1} or {sourceGroup: sg1} that we want to
         * match against
         * @param {Number} [params.from] The start of the range to use.
         * @param {Number} [params.to] The end of the range to use.
         * @return {HttpPromise}
         */
        function getContentRatingsForContentInitiateTraining(params) {
            // jshint maxcomplexity:9
            var url = getRatingsEndpoint('contentBest'),
                parameters = {
                    contentId: params.contentId
                };
            var contentsToRate = {};

            if (params.recommendationsSource) {
                contentsToRate.source = params.recommendationsSource;
                if (_.isArray(params.channelId) && params.channelId.length) {
                    contentsToRate.channelId = params.channelId;
                }
            }

            if (params.acquisitonDate) {
                contentsToRate.acquisitionDate = params.acquisitionDate;
            }

            if (params.includeLastRated) {
                parameters.includeLastRated = params.includeLastRated;
            }

            if (params.itemsToRate) {
                parameters.itemsToRate = params.itemsToRate;
            }

            if (params.from >= 0 && params.to >= 0) {
                parameters.from = params.from;
                parameters.to = params.to;
            }

            if (!_.isEmpty(contentsToRate)) {
                parameters.contentsToRate = contentsToRate;
            }

            return $http.post(url, parameters);
        }

        /**
         * @param {Object} parameters Parameters
         * @param {Object} [parameters.contentId] ID of content.
         * @param {String} [parameters.recommendationsSource] Source for
         * contents that should be used for rating.
         * @param {number} [parameters.from] ID of content.
         * @param {number} [parameters.to] ID of content.
         * @param {String} [parameters.recommendationsSourceGroup] Source group
         * for the rating operation.
         * @param {number} [parameters.recommendationsAcquisitionDate]
         * Acquisition date for the recommendations.
         * @param {Object[]} [parameters.itemsToRate] an array with objects
         * of type {source: s1} or {sourceGroup: sg1} that we want to
         * match against
         * @param {Boolean} [parameters.includeLastRated] Whether to include
         * information about the last successful CvC task for the given content.
         * @return {HttpPromise}
         */
        function getContentRatingsForContent(parameters) {
            function applyContentsToRateFilter(apiParams) {
                // jshint maxcomplexity: 6
                var contentsToRate = {};

                if (parameters.recommendationsSource) {
                    contentsToRate.source = parameters.recommendationsSource;
                }

                if (parameters.recommendationsSourceGroup) {
                    contentsToRate.sourceGroup = parameters.recommendationsSourceGroup;
                }

                if (_.isArray(parameters.channelId) &&
                    parameters.channelId.length) {
                    contentsToRate.channelId = parameters.channelId;
                }

                if (parameters.recommendationsAcquisitionDate) {
                    contentsToRate.acquisitionDate = parameters.recommendationsAcquisitionDate;
                }

                if (!_.isEmpty(contentsToRate)) {
                    apiParams.contentsToRate = contentsToRate;
                }
            }

            var url = getRatingsEndpoint('contentBest'),
                apiParams = {};

            if (parameters.contentId) {
                apiParams.contentId = parameters.contentId;
            }

            if (parameters.from >= 0 && parameters.to >= 0) {
                apiParams.from = parameters.from;
                apiParams.to = parameters.to;
            }

            applyContentsToRateFilter(apiParams);

            if (parameters.itemsToRate) {
                apiParams.itemsToRate = parameters.itemsToRate;
            }
            if (parameters.includeLastRated) {
                apiParams.includeLastRated = parameters.includeLastRated;
            }

            return $http.get(url + ServiceUtils.constructQueryParameters(apiParams));
        }

        function removeContentRatingsForContent(contentId) {
            var url = getRatingsEndpoint('contentBest'),
                apiParams = {
                    contentId: contentId
                };

            return $http.delete(
                url + ServiceUtils.constructQueryParameters(apiParams));
        }

        function removeAllContentToContentRatings() {
            var url = getRatingsEndpoint('removeAllContentBest');

            return $http.post(url);
        }

        function getContentRatingsInCategories (contentIds, categoryIds) {
            var url = getRatingsEndpoint('categoryToContent'),
                parameters = {
                    contentIds: contentIds,
                    categoryIds: categoryIds
                };
            return $http.post(url, parameters);
        }

        return {
            // jshint maxlen:150
            countRatingsForSmartFolder: countRatingsForSmartFolder,
            countIndividualRatingsForSmartFolder: countIndividualRatingsForSmartFolder,
            getCategoryRatingsForContent: getCategoryRatingsForContent,
            getCategoryRatingMapForContents : getCategoryRatingMapForContents,
            getContentRatingsForContent: getContentRatingsForContent,
            getContentRatingsForContentInitiateTraining: getContentRatingsForContentInitiateTraining,
            getRatings: getRatings,
            getRatingsAsCSV: getRatingsAsCSV,
            getRatingsForSmartFolder: getRatingsForSmartFolder,
            getRatingsForSmartFolderCSV: getRatingsForSmartFolderCSV,
            removeContentRatingsForContent: removeContentRatingsForContent,
            removeAllContentToContentRatings: removeAllContentToContentRatings,
            removeRatings: removeRatings,
            getContentRatingsInCategories: getContentRatingsInCategories
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.readingProfilesService
 * @description
 * # readingProfiles
 * Service in the rest.
 */
angular.module('intellogoSDK')
  .service('ReadingProfilesService',
      ["$http", "RatingService", "ServiceUtils", function ($http, RatingService, ServiceUtils) {

          /**
           * Save changes to the given profile, or adds it to the Intellogo system if a new one.
           * Changes to the profile's contents list require a Content object that has at least a
           * _id property.
           * @param {Object} profile The profile to save
           * @param {String} [profile._id] The id of the profile to update, if it exists.
           * @param {String} profile.clientReference The client reference value for the profile.
           * @param {Boolean} profile.autoupdateCategory
           * @param {Boolean} profile.autoupdateCombinations
           * @param {Array<Content>} profile.assignedContents An array of new contents to assign
           * to a profile. Content already included in the profile does not need to be specified
           * and will not be removed (unless it is included in the unassignedContents parameter).
           * @param {Array<Content>} profile.unassignedContents An array of content entities to
           * remove from the reading profile definition.
           * @param {Function} callback Will be called after the profile is saved, or if an error
           * occurs. If successful, the callback will be called with the profile data, with its
           * _id field set.
           */
          function saveProfile (profile, callback) {
            var contentIdsToAssign =
                    _.pluck(profile.assignedContents, '_id'),
                contentIdsToUnassign =
                    _.pluck(profile.unassignedContents, '_id'),
                returnedProfile = _.clone(profile);

            var profileForSave = _.pick(profile, [
                '_id',
                'clientReference',
                'autoupdateCategory',
                'autoupdateCombinations',
            ]);
              profileForSave.contentIdsToAssign = contentIdsToAssign;
              profileForSave.contentIdsToUnassign = contentIdsToUnassign;

            addOrUpdateProfile(profileForSave)
            /*
              saveResult can be
              * the profile data of the newly created profile
              * or a { success: true } object in case of update
              */
                .success(function (saveResult) {
                    if (!profileForSave._id) {
                        /*
                         * Set the id in case of new profile,
                         * so that the profile is recognized
                         * in the future (on next save)
                         */
                        if (_.isArray(saveResult) &&
                            saveResult[0]) {
                            saveResult = saveResult[0];
                            returnedProfile._id = saveResult._id;
                        }
                    }
                    callback(null, returnedProfile);

                })
                .error(callback);
        }

        function addOrUpdateProfile(profile) {
            // In case the profile exists, just update it
            if (profile._id) {
                return updateProfile(profile);
            } else {
                profile.contents = profile.contentIdsToAssign;
                delete profile.contentIdsToAssign;
                delete profile.contentIdsToUnassign;

                return addProfile(profile);
            }
        }

        function removeProfiles (profileIds) {
            if (!_.isArray(profileIds)) {
                profileIds = [profileIds];
            }

            return $http.post(ServiceUtils.constructServiceUrl('profiles', 'remove'),
                              profileIds);
        }

        function addProfile (profile) {
            return $http.post(ServiceUtils.constructServiceUrl('profiles', 'create'),
                              [profile]);
        }

        function updateProfile(profile) {
            var params = {
                profileId: profile._id,
                profileData: profile
            };
            delete params.profileData._id;
            return $http.post(ServiceUtils.constructServiceUrl('profiles', 'update'),
                              params);
        }

        function loadProfiles() {
            return $http.get(ServiceUtils.constructServiceUrl('profiles', 'all'));
        }

        function loadProfileContents(profileId, loadMetadata, from, to) {
            var queryParams = {
                profileId: profileId,
                metadata: loadMetadata,
                from: from,
                to: to
            };

            var url = ServiceUtils.constructServiceUrl('profiles', 'contents') +
                      ServiceUtils.constructQueryParameters(queryParams);

            return $http.get(url);
        }

        /**
         * Returns a category-content map for the analyzed profile.
         * Use contents as it could be an not unexisting (new) profile.
         * @param profile
         * @param profile.contents
         * @param profile._id
         * @returns
         * {categoryId: {
         *    categoryData: {
         *        _id: {String},
         *        name: {String},
         *        displayName: {String},
         *        productionReady: {Boolean}
         *        },
         *    contents: [contentId1, ...,]
         *    }
         * }
         */
        function analyzeProfile(profile, minScore, productionReady) {
            var profileId, contentIds;
            /*
             We need either profile id (in case of loaded profile
             or content ids in case of new.
             */
            if (profile._id) {
                profileId = profile._id;
            } else {
                contentIds = _.pluck(profile.contents, '_id');
            }

            return RatingService
                .getCategoryRatingMapForContents(profileId,
                                                 contentIds,
                                                 minScore,
                                                 productionReady);
        }

        function categoryCombinations (profile, params) {
            params = _.clone(params, true);

            if (profile._id) {
                params.profileId = profile._id;
            } else {
                params.contentIds = _.pluck(profile.contents, '_id');
            }

            var url = ServiceUtils.constructServiceUrl('profiles',
                                                       'categoryCombinations');
            return $http.post(url,
                              params);
        }

        function getProfileContentCount(profile) {
            var queryParams = {
                profileId: profile._id
            };

            var url = ServiceUtils.constructServiceUrl('profiles',
                                                       'contentsCount') +
                      ServiceUtils.constructQueryParameters(queryParams);

            return $http.get(url);
        }

        return {
            saveProfile             : saveProfile,
            loadProfiles            : loadProfiles,
            loadProfileContents     : loadProfileContents,
            getProfileContentsCount : getProfileContentCount,
            analyzeProfile          : analyzeProfile,
            removeProfiles          : removeProfiles,
            categoryCombinations    : categoryCombinations
        };
  }]);

'use strict';

angular.module('intellogoSDK').factory(
    'RunService',
    ["$http", "API_LOCATION", "ServiceUtils", function ($http, API_LOCATION, ServiceUtils) {
        function getAllRuns() {
            return $http.get(API_LOCATION + '/api/runs');
        }

        function removeRun(id) {
            return $http.delete(API_LOCATION + '/api/runs/' + id);
        }

        /**
         * Retrieves the runs associated with a category.
         * @param categoryId The ID of the category.
         * @returns {*}
         */
        function getRunsForCategory(categoryId) {
            return $http.get(API_LOCATION + '/api/runs' +
                             ServiceUtils.constructQueryParameters(
                                 {
                                     categoryId: categoryId
                                 }));
        }

        /**
         * Returns the IDs of all categories that have at least one finished
         * run.
         */
        function getAllCategoriesWithFinishedRuns() {
            return $http.get(API_LOCATION +
                             '/api/runs/categoriesWithFinishedRuns');
        }

        return {
            getAllCategoriesWithFinishedRuns: getAllCategoriesWithFinishedRuns,
            getAllRuns: getAllRuns,
            getRunsForCategory: getRunsForCategory,
            removeRun: removeRun
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.ServiceUtils
 * @description
 * # ServiceUtils
 * Factory in the rest.
 */
angular.module('intellogoSDK').factory(
    'ServiceUtils', ["INTELLOGO_API_LOCATION", function (INTELLOGO_API_LOCATION) {
        function processArray(key, parameters) {
            return _.chain(parameters)
                .map(function (value, idx) {
                         var result;
                         if (_.isObject(value)) {
                             result = processObject(key, value);
                         } else {
                             result = processSimpleKeyValue(key, value);
                         }
                         return (idx === 0 ? '' : '&') + result;
                     })
                .reduce(function (result, params) {
                            return result + params;
                        })
                .value();
        }

        function processObject(key, object) {
            return encodeURIComponent(key) + '=' +
                encodeURIComponent(JSON.stringify(object));
        }

        function processSimpleKeyValue(key, value) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(value);
        }

        function processParameter(key, value, first) {
            var result;

            if (_.isArray(value)) {
                result = processArray(key, value);
            } else if (_.isObject(value)) {
                result = processObject(key, value);
            } else {
                result = processSimpleKeyValue(key, value);
            }

            return (first ? '?' : '&') + result;
        }

        function constructQueryParameters(queryParams) {
            return _.chain(queryParams)
                .pairs()
                .filter(function (pair) {
                            var value = pair[1],
                                isNonNull = (value === 0 || !!value),
                                isEmptyArray = _.isArray(value) &&
                                    !value.length;
                            return isNonNull && !isEmptyArray;
                        })
                .map(function (pair, idx) {
                         return processParameter.call(this,
                                                      pair[0],
                                                      pair[1],
                                                      idx === 0);
                     })
                .reduce(function (result, params) {
                            return result + params;
                        }, '')
                .value();
        }

        /**
         * Constructs an URL to a rest service by the path to the service.
         *
         * Use "constructServiceUrl" instead of this method, if possible.
         * @param {string} path The path (e.g. "/contents/sources").
         * @return {string} The result (e.g.
         * "http://api-location.com/api/contents/sources").
         */
        function constructServiceByPath(path) {
            var apiLocation = INTELLOGO_API_LOCATION,
                location = apiLocation[apiLocation.length - 1] === '/' ?
                    apiLocation : apiLocation + '/',
                actualPath = path[0] === '/' ? path.slice(1) : path;
            return location + 'api/' + actualPath;
        }

        /**
         * Constructs a service URL by a group and service names.
         * @param {string} group The group (e.g. "contents")
         * @param {string} [service] The service (e.g. "sources")
         * @param {string} [additionalParams] Additional parameters that will be
         * appended to the URL without any delimiters.
         * @return {string} The result (e.g.
         * "http://api-location.com/api/contents/sources").
         */
        function constructServiceUrl(group, service, additionalParams) {
            var path;
            if (service) {
                path = group + '/' + service;
            } else {
                path = group;
            }
            return constructServiceByPath(path) + (additionalParams || '');
        }

        return {
            constructQueryParameters: constructQueryParameters,
            constructServiceUrlByPath: constructServiceByPath,
            constructServiceUrl: constructServiceUrl
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.SmartFoldersService
 * @description
 * # SmartFoldersService
 * Services for smart folder manipulation.
 */
angular.module('intellogoSDK')
    .factory(
    'SmartFoldersService',
    // jshint maxparams:5
    ["$q", "$http", "$rootScope", "ServiceUtils", "INTELLOGO_EVENTS", function ($q, $http, $rootScope, ServiceUtils, INTELLOGO_EVENTS) {

        function _getSyncDummyPromise(value, error) {
            if (error) {
                var deferred = $q.defer();
                deferred.reject();
                return deferred.promise;
            }
            return $q.when(value);
        }

        function getSmartFoldersEndpoint(service) {
            return ServiceUtils.constructServiceUrl('smartFolders', service);
        }

        /**
         * Constructs folder update object;
         *   Items to proper format.
         * @param smartFolders
         * @return {Array}
         */
        function convertToServiceFormat (smartFolders) {
            function formatFolderItem(item) {
                var finalObject = {
                    min: item.value[0],
                    max: item.value[1]
                };

                if (item.categoryId) {
                    finalObject.categoryId = item.categoryId;
                } else if (item.contentId) {
                    finalObject.contentId = item.contentId;
                } else {
                    console.error('No id for the item specified!');
                }

                return finalObject;
            }

            return _.map(smartFolders, function (smartFolder) {
                var result = {
                    _id: smartFolder._id
                };

                // include only selected fields
                if (smartFolder.metadata) {
                    result.metadata = _.clone(smartFolder.metadata);
                }
                if (_.isArray(smartFolder.items)) {
                    result.items = _.map(smartFolder.items, formatFolderItem);
                }

                return result;
            });
        }

        /**
         * Gets all smart folders from the server.
         * @param categoryId {string} if passed,
         * will filter the resulting smartCollections by category id
         * @param metadataFilter {Object} optional filters for the smart collection metadata
         * Currently supported is only filtering by tags.
         * @param metadataFilter.tags {Array} an array of tags to match. Only smart collections
         * matching at least one of the provided tags will be returned.
         * @returns {HttpPromise}
         */
        function getAllSmartFolders(categoryId, metadataFilter) {
            var url = getSmartFoldersEndpoint();
            var params = {categoryId: categoryId};
            if (metadataFilter && metadataFilter.tags) {
                params.tags = JSON.stringify(metadataFilter.tags);
            }

            return $http.get(url, {params: params});
        }

        function getSmartFoldersById(smartFolderIds) {
            var url =  getSmartFoldersEndpoint('info');
            return $http.post(url, smartFolderIds);
        }

        function getAllSmartFolderTags() {
            return $http.get(getSmartFoldersEndpoint('tags'));
        }

        function getSmartFolderImage(smartFolderId) {
            var url =  getSmartFoldersEndpoint('image/' + smartFolderId);

            return $http.get(url);
        }

        function deleteSmartFolder(smartFolderId) {
            return $http.delete(getSmartFoldersEndpoint(smartFolderId));
        }

        function updateSmartFolders(smartFolders) {
            var response;
            if (!smartFolders) {
                response = _getSyncDummyPromise(null, 'No smart folders given.');
            } else {
                if (!Array.isArray(smartFolders)) {
                    smartFolders = [smartFolders];
                }
                smartFolders = convertToServiceFormat(smartFolders);
                response = $http.post(getSmartFoldersEndpoint('update'),
                                          smartFolders);

                response.success(function () {
                    $rootScope.$broadcast(INTELLOGO_EVENTS.SMART_FOLDER_UPDATED);
                });
            }
            return response;
        }

        function addSmartFolder (smartFolder) {
            if(!Array.isArray(smartFolder)) {
                smartFolder = [smartFolder];
            }
            smartFolder = convertToServiceFormat(smartFolder);
            var response = $http.post(getSmartFoldersEndpoint('create'),
                                      smartFolder);
            response.success(function( )  {
                $rootScope.$broadcast(INTELLOGO_EVENTS.SMART_FOLDER_ADDED);
            });
            return response;
        }

        return {
            // jshint maxlen:150
            getAllSmartFolders   : getAllSmartFolders,
            getAllSmartFolderTags: getAllSmartFolderTags,
            getSmartFoldersById  : getSmartFoldersById,
            deleteSmartFolder    : deleteSmartFolder,
            updateSmartFolders   : updateSmartFolders,
            addSmartFolder       : addSmartFolder,
            getSmartFolderImage  : getSmartFolderImage
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.CategoryService
 * @description
 * # SystemTasksService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
        'SystemTasksService',
        // jshint maxparams:5
        ["$http", "API_LOCATION", "ServiceUtils", function ($http, API_LOCATION, ServiceUtils) {
            var INSIGHTS_UPDATE_TASK                   = {
                    id      : 'system-categories-update',
                    name    : 'Insights Update',
                    endpoint: 'initiateCategoriesUpdate'
                },
                SMART_COLLECTIONS_CACHE_UPDATE_TASK    = {
                    id      : 'system-smart-folder-cache-update',
                    name    : 'Smart Collections Cache Update',
                    endpoint: 'initiateSmartFoldersCacheUpdate'
                },
                SMART_COLLECTIONS_CONTENTS_UPDATE_TASK = {
                    id      : 'system-smart-folder-contents-update',
                    name    : 'Smart Collections Contents Update',
                    endpoint: 'initiateSmartFolderContentsUpdate'
                },
                RSS_INGESTION_TASK                     = {
                    id      : 'system-rss-ingestion',
                    name    : 'RSS Ingestion',
                    endpoint: 'initiateRssIngestion'
                },
                CONTENT_CLEANUP_TASK                   = {
                    id      : 'system-content-cleanup',
                    name    : 'Content Cleanup',
                    endpoint: 'initiateContentCleanup'
                },
                PROFILES_UPDATE_TASK                   = {
                    id      : 'system-profiles-update',
                    name    : 'Profiles Update',
                    endpoint: 'initiateProfilesUpdate'
                },
                YOUTUBE_CHANNELS_UPDATE_TASK           = {
                    id      : 'system-channels-update',
                    name    : 'Youtube Channels Update',
                    endpoint: 'initiateYoutubeChannelsUpdate'
                },
                DYNAMIC_INSIGHTS_CLEANUP_TASK          = {
                    id      : 'system-dynamic-categories-cleanup',
                    name    : 'Dynamic Insights Cleanup',
                    endpoint: 'initiateDynamicInsightsCleanup'
                },
                CLEAN_ALL_STALE_CONTENT_TASK          = {
                    id      : 'all-sources-cleanup-task',
                    name    : 'Rss Content Cleanup',
                    endpoint: 'cleanStaleContent'
                },
                ALL_SYSTEM_TASKS                       = [
                    INSIGHTS_UPDATE_TASK,
                    RSS_INGESTION_TASK,
                    SMART_COLLECTIONS_CONTENTS_UPDATE_TASK,
                    SMART_COLLECTIONS_CACHE_UPDATE_TASK,
                    PROFILES_UPDATE_TASK,
                    CONTENT_CLEANUP_TASK,
                    YOUTUBE_CHANNELS_UPDATE_TASK,
                    DYNAMIC_INSIGHTS_CLEANUP_TASK,
                    CLEAN_ALL_STALE_CONTENT_TASK
                ];

            function getSystemTaskTypes() {
                return ALL_SYSTEM_TASKS;
            }

            function initiateSystemTask(task) {
                if (task.endpoint) {
                    return $http.post(
                        ServiceUtils.constructServiceUrl('/admin/system',
                                                         task.endpoint));
                } else {
                    console.log('Could not initialize ' +
                                'unknown system task ' + task);
                    return undefined;
                }
            }

            return {
                getSystemTaskTypes: getSystemTaskTypes,
                initiateSystemTask: initiateSystemTask
            };
        }]);

'use strict';

angular.module('intellogoSDK')
    .factory(
        'TextStatsService',
        ["$http", "ServiceUtils", function ($http, ServiceUtils) {
            function extractKeywords (articleUrl, extractors) {
                var url = ServiceUtils.constructServiceUrl(
                    'processing',
                    'keywords',
                    ServiceUtils.constructQueryParameters({
                        url: articleUrl,
                        extractors: extractors.join(',')
                    }));
                return $http.get(url);
            }

            return {
                extractKeywords: extractKeywords
            };
        }]);

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
    ["LocalStorageBackedVariable", "IntellogoCredentials", function (LocalStorageBackedVariable, IntellogoCredentials) {
        var ACCESS_TOKEN = 'access_token',
            TOKEN_EXPIRATION = 'token_expiration',
            REFRESH_TOKEN = 'refresh_token';

        var localStorageVarsHolders = {};

        function generateKey(keyName) {
            return SparkMD5.hash(IntellogoCredentials.getOauthClientId() + '.' + keyName);
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
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.TrainingService
 * @description
 * # TrainingService
 * Service for trainings manipulation.
 */
angular.module('intellogoSDK')
    .factory(
    'TrainingService',
    ["$http", "ServiceUtils", function ($http, ServiceUtils) {
        /**
         * Initiates a training job on the server.
         * @param categoryIds The ID of the category to use for training.
         * @param [sources] The content sources to use for rating. The contents
         * will be filtered by its value.
         * @param [combinations] Algorithm/fingerprint combinations to use for
         * training. Useful for partial training.
         * @returns {HttpPromise}
         */
        function initiateTraining(categoryId, sources, combinations) {
            var parameters = {
                categoryId: categoryId
            };

            if (sources) {
                if (!_.isArray(sources)) {
                    sources = [sources];
                }
                parameters.contentSource = sources;
            }

            if (combinations) {
                parameters.combinations = combinations;
            }

            return $http.post(ServiceUtils
                                  .constructServiceUrl('trainings','initiate'),
                              parameters);
        }

        /**
         * Returns the status of the current training operations.
         * @returns {HttpPromise}
         */
        function getStatus(timeInterval, taskTypes, includeTaskResults) {
            var params = {
                timeInterval: timeInterval,
                includeTaskResults: !!includeTaskResults
            };
            if (_.isArray(taskTypes) && taskTypes.length > 0) {
                params.taskTypes = taskTypes;
            }

            return $http.get(ServiceUtils
                                 .constructServiceUrl('trainings', 'status'),
                             {params: params});
        }

        /**
         * Returns the status of the current training operations.
         * @returns {HttpPromise}
         */
        function getTaskStatusById(taskId) {
            return $http.get(ServiceUtils
                             .constructServiceUrl('trainings','taskStatus'), {
                                 params : { taskId: taskId }
                             });
        }

        /**
         * Cancels a task by ID.
         * @param taskId The ID of the target task.
         * @param [requestId] The requestId received when the task was initiated
         * @returns {HttpPromise}
         */
        function cancelTask(taskId, requestId ) {
            var url = ServiceUtils.constructServiceUrl('trainings', 'cancel'),
                taskInfo = {taskId: taskId},
                args;
            if (requestId) {
                taskInfo.requestId = requestId;
            }

            args = {
                    taskIds: [taskInfo]
            };

            return $http.post(url, args);
        }

        return {
            cancelTask       : cancelTask,
            getStatus        : getStatus,
            getTaskStatusById: getTaskStatusById,
            initiateTraining : initiateTraining
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.TrainingSetService
 * @description
 * # TrainingSetService
 * Used for manipulating training sets on the server side.
 */
angular.module('intellogoSDK')
    .factory(
    'TrainingSetService',
    ["$http", "API_LOCATION", "ServiceUtils", function ($http, API_LOCATION, ServiceUtils) {

        /**
         * Returns all training sets.
         * @returns {HttpPromise}
         */
        function getAllTrainingSets() {
            var url = API_LOCATION + '/api/trainingSets/all';
            return $http.get(url);
        }

        /**
         * Generates training sets for categories.
         * @param categoryId ID of the target category. If you don't provide,
         * all categories will be used for training set creation.
         * @returns {HttpPromise}
         */
        function generateTrainingSets(categoryId) {
            var url = API_LOCATION + '/api/trainingSets/generate' +
                ServiceUtils.constructQueryParameters(
                    {
                        categoryId: categoryId
                    });

            return $http.post(url);
        }

        return {
            generateTrainingSets: generateTrainingSets,
            getAllTrainingSets: getAllTrainingSets
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.urlUtils
 * @description
 * # urlUtils
 * Service in the rest.
 */
angular.module('intellogoSDK').factory(
    'UrlUtils',
    ["TokenHandler", function (TokenHandler) {
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
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.TokenHandler
 * @description
 * # TokenHandler
 * Handles access tokens.
 */
angular.module('intellogoSDK').factory(
    'UserDataHandler',
    ["LocalStorageBackedVariable", function (LocalStorageBackedVariable) {
        var contentSourcesRestriction =
                LocalStorageBackedVariable.createHolder('content_sources'),
            defaultSource =
                LocalStorageBackedVariable.createHolder('default_source'),
            categoriesRestriction =
                LocalStorageBackedVariable.createHolder('categories'),
            userType =
                LocalStorageBackedVariable.createHolder('user_type'),
            userImage = LocalStorageBackedVariable.createHolder('image_path'),
            eulaAccepted =
                LocalStorageBackedVariable.createHolder('eula_accepted');

        return {
            /**
             * Sets a new value for the contentSourcesRestriction.
             * @param {String[]} sources The sources restriction for the user
             */
            setContentSourcesRestriction: contentSourcesRestriction.setValue,
            /**
             * @returns {String[]} sources The sources restriction for the user
             */
            getContentSourcesRestriction: contentSourcesRestriction.getValue,
            /**
             * Sets a new value for the defaultSource.
             * @param {String} source The default source for the user
             */
            setDefaultSource: defaultSource.setValue,
            /**
             * @returns {String} source The default source for the user
             */
            getDefaultSource: defaultSource.getValue,
            /**
             * Sets a new value for the categories restrictions.
             * @param {String[]} tags The categories restriction for the user
             */
            setCategoriesRestriction: categoriesRestriction.setValue,
            /**
             * @returns {String[]} tags The categories restriction for the user
             */
            getCategoriesRestriction: categoriesRestriction.getValue,
            /**
             * Set the path of the user logo
             * @param {String} logoPath
             */
            setUserImagePath: userImage.setValue,
            /**
             * @returns {String} logoPath Where the user logo is located
             */
            getUserImagePath: userImage.getValue,
            /**
             * @param {String} userType The type of the current user.
             */
            setUserType: userType.setValue,
            /**
             * @returns {String} The type of the current user.
             */
            getUserType: userType.getValue,
            /**
             * @param {Boolean} accepted Whether the user has accepted the EULA
             */
            setEULAAccepted: eulaAccepted.setValue,
            /**
             * @returns {Boolean} Whether the user has accepted the EULA
             */
            getEULAAccepted: eulaAccepted.getValue,

            resetValues: function () {
                userType.setValue(null);
                contentSourcesRestriction.setValue([]);
                categoriesRestriction.setValue([]);
                defaultSource.setValue(null);
                userImage.setValue(null);
                // do not reset the eula value
                // it is not tied to the user currently
            }
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.UserDataService
 * @description
 * # UserDataService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
    'UserDataService',
    ["$http", "$q", "UserDataHandler", "API_LOCATION", function ($http, $q, UserDataHandler, API_LOCATION) {

        function loadUserData() {
            var deferred = $q.defer();
            var response = $http.get(API_LOCATION + '/api/currentUser/info');
            response.success(function (userData) {
                UserDataHandler.setUserType(userData.userType);
                UserDataHandler.setContentSourcesRestriction(
                    userData.sourcesRestriction);
                UserDataHandler.setDefaultSource(userData.defaultSource);
                UserDataHandler.setCategoriesRestriction(
                    userData.categoriesRestriction);
                UserDataHandler.setUserImagePath(userData.image);
                deferred.resolve();
            });
            response.error(function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function resetUserData() {
            UserDataHandler.resetValues();
        }

        return {
            loadUserData: loadUserData,
            resetUserData: resetUserData
        };
    }]);

'use strict';

/**
 * @ngdoc service
 * @name intellogoSDK.UserDataService
 * @description
 * # UserDataService
 */
angular.module('intellogoSDK')
    .factory(
        'UsersService',
        ["$http", "ServiceUtils", function ($http, ServiceUtils) {
            function getUsersByUsernameSearch(username) {
                var url = ServiceUtils.constructServiceUrl(
                    'users',
                    'all',
                    ServiceUtils.constructQueryParameters({search: username}));
                return $http.get(url);
            }

            function getUsersByIds(userIds) {
                var url = ServiceUtils.constructServiceUrl(
                    'users',
                    'all',
                    ServiceUtils.constructQueryParameters({userIds: userIds}));
                return $http.get(url);
            }

            return {
                getUsersByUsername: getUsersByUsernameSearch,
                getUsersByIds     : getUsersByIds
            };
        }]);

'use strict';

/**
 * @ngdoc service
 * @name rest.VersionService
 * @description
 * # VersionService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
        'VersionService',
        ["$http", "$q", "API_LOCATION", function ($http, $q, API_LOCATION) {
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
        }]);
