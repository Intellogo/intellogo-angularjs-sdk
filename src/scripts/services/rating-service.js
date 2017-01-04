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
    function ($http, ServiceUtils, FileDownloadDialogService) {
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
         * @param {string[]} [recommendationsSource] Optional filter by source
         * @param {number} [from] Start of the "slice" to show.
         * @param {number} [to] Start of the "slice" to show.
         * @param {Boolean} smartFolder.useSmartFolderCache Whether to use
         * cached results
         * for the smart folder.
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
                var metadataFilter = {},
                    recommendationsSource = filters && filters.recommendationSources,
                    acquisitionDate = filters && filters.acquisitionDate,
                    channelId = filters && filters.channelId;

                if (recommendationsSource) {
                    metadataFilter.source = recommendationsSource;
                }
                if (acquisitionDate) {
                    metadataFilter.acquisitionDate = acquisitionDate;
                }

                if (_.isArray(channelId) && channelId.length) {
                    metadataFilter.channelId = channelId;
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
                var smartFolderParameters =
                    _.map(smartFolder.items,
                        extractSmartFolderItemData);
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
                    profileId: profileId,
                    contentIds: contentIds,
                    productionReady: productionReady,
                    minScore: minScore
                },
                apiUrl =
                    ServiceUtils
                        .constructServiceUrl('rating',
                                             'contentsCategoryRatingsMap');

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
    });
