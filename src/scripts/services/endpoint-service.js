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
