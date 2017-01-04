'use strict';

/**
 * @ngdoc service
 * @name rest.CaptionsService
 * @description
 * # CaptionsService
 * Factory in the rest.
 */
angular.module('intellogoSDK').factory(
    'CaptionsService', function ($http, API_LOCATION) {
        function getAllChannels() {
            return $http.get(API_LOCATION + '/api/captions/channels');
        }

        function deleteChannel(channel) {
            var filter = {
                source: 'Youtube',
                channelId: channel.id
            };

            return $http.post(API_LOCATION + '/api/contents/delete', {
                metadataFilter: filter
            });
        }

        return {
            deleteChannel: deleteChannel,
            getAllChannels: getAllChannels
        };
    });
