'use strict';

angular.module('rest')
    .factory('ContentGroupsService', ['$resource', 'ServiceUtils',
        function ($resource, ServiceUtils) {
            return $resource(
                ServiceUtils.constructServiceUrl('contentGroups', ':id'),
                {id: '@_id'}, // non-GET
                {}
            );
        }
    ]);
