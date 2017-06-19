'use strict';

angular.module('intellogoSDK').factory(
    'UsageStatisticsService', function ($http, ServiceUtils) {

        function getUsageByTime(start, end, clientId, timeFrame) {

            var url = ServiceUtils.constructServiceUrl('admin/endpoints/statistics',
                'spentByTimeFrame'),
                queryParameters = {start: start, end: end, clientId:clientId, timeFrame:timeFrame};
            url += ServiceUtils.constructQueryParameters(queryParameters);

            return $http.get(url);
        }

        function getUsageByEndpoint(start, end, clientId) {
            var url = ServiceUtils.constructServiceUrl('admin/endpoints/statistics',
                'spentByEndpoints'),
                queryParameters = {start: start, end: end, clientId:clientId};
            url += ServiceUtils.constructQueryParameters(queryParameters);

            return $http.get(url);
        }

        return {
            getUsageByEndpoint          : getUsageByEndpoint,
            getUsageByTime              : getUsageByTime
        };
    });