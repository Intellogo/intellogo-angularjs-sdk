'use strict';

/**
 * @ngdoc service
 * @name rest.ContentService
 * @description
 * # ContentService
 * Factory in the rest.
 */
angular.module('intellogoSDK').factory(
    'ContentService', function ($http, ServiceUtils) {
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
    });
