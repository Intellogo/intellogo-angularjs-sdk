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
