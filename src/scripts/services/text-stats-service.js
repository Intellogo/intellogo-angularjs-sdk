'use strict';

angular.module('intellogoSDK')
    .factory(
        'TextStatsService',
        function ($http, ServiceUtils) {
            function extractKeywords (articleUrl, extractors, extractorOptions) {
                var url = ServiceUtils.constructServiceUrl(
                    'processing',
                    'keywords',
                    ServiceUtils.constructQueryParameters({
                        url: articleUrl,
                        extractors: extractors.join(','),
                        options: extractorOptions && JSON.stringify(extractorOptions)
                    }));
                return $http.get(url);
            }

            return {
                extractKeywords: extractKeywords
            };
        });
