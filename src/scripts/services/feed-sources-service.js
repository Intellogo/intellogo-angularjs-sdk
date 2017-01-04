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
    function ($http, API_LOCATION) {
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
    });
