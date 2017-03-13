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
