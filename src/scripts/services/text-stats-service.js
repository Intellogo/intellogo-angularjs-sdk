'use strict';

angular.module('intellogoSDK')
    .factory(
        'TextStatsService',
        function ($http, ServiceUtils) {
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
        });
