'use strict';

/**
 * @ngdoc service
 * @name rest.SmartFoldersService
 * @description
 * # SmartFoldersService
 * Services for smart folder manipulation.
 */
angular.module('intellogoSDK')
    .factory(
    'SmartFoldersService',
    // jshint maxparams:5
    function ($q, $http, $rootScope, API_LOCATION, REST_EVENTS) {

        function _getSyncDummyPromise(value, error) {
            if (error) {
                var deferred = $q.defer();
                deferred.reject();
                return deferred.promise;
            }
            return $q.when(value);
        }

        function getSmartFoldersEndpoint(service) {
            return API_LOCATION + '/api/smartFolders/' + service;
        }

        /**
         * Constructs folder update object;
         *   Items to proper format.
         * @param smartFolders
         * @return {Array}
         */
        function convertToServiceFormat (smartFolders) {
            function formatFolderItem(item) {
                var finalObject = {
                    min: item.value[0],
                    max: item.value[1]
                };

                if (item.categoryId) {
                    finalObject.categoryId = item.categoryId;
                } else if (item.contentId) {
                    finalObject.contentId = item.contentId;
                } else {
                    console.error('No id for the item specified!');
                }

                return finalObject;
            }

            return _.map(smartFolders, function (smartFolder) {
                var result = {
                    _id: smartFolder._id
                };

                // include only selected fields
                if (smartFolder.metadata) {
                    result.metadata = _.clone(smartFolder.metadata);
                }
                if (_.isArray(smartFolder.items)) {
                    result.items = _.map(smartFolder.items, formatFolderItem);
                }

                return result;
            });
        }

        /**
         * Gets all smart folders from the server.
         * @param categoryId {string} if passed,
         * will filter the resulting smartCollections by category id
         * @returns {HttpPromise}
         */
        function getAllSmartFolders(categoryId) {
            var url = API_LOCATION + '/api/smartFolders';

            return $http.get(url, {params: {categoryId: categoryId}});
        }

        function getSmartFolderImage(smartFolderId) {
            var url = API_LOCATION + '/api/smartFolders/image/' + smartFolderId;

            return $http.get(url);
        }

        function deleteSmartFolder(smartFolderId) {
            return $http.delete(getSmartFoldersEndpoint(smartFolderId));
        }

        function updateSmartFolders(smartFolders) {
            var response;
            if (!smartFolders) {
                response = _getSyncDummyPromise(null, 'No smart folders given.');
            } else {
                if (!Array.isArray(smartFolders)) {
                    smartFolders = [smartFolders];
                }
                smartFolders = convertToServiceFormat(smartFolders);
                response = $http.post(getSmartFoldersEndpoint('update'),
                                          smartFolders);

                response.success(function () {
                    $rootScope.$broadcast(REST_EVENTS.SMART_FOLDER_UPDATED);
                });
            }
            return response;
        }

        function addSmartFolder (smartFolder) {
            if(!Array.isArray(smartFolder)) {
                smartFolder = [smartFolder];
            }
            smartFolder = convertToServiceFormat(smartFolder);
            var response = $http.post(getSmartFoldersEndpoint('create'),
                                      smartFolder);
            response.success(function( )  {
                $rootScope.$broadcast(REST_EVENTS.SMART_FOLDER_ADDED);
            });
            return response;
        }

        return {
            // jshint maxlen:150
            getAllSmartFolders  : getAllSmartFolders,
            deleteSmartFolder   : deleteSmartFolder,
            updateSmartFolders  : updateSmartFolders,
            addSmartFolder      : addSmartFolder,
            getSmartFolderImage : getSmartFolderImage
        };
    });
