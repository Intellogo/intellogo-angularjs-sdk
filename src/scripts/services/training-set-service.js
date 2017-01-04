'use strict';

/**
 * @ngdoc service
 * @name rest.TrainingSetService
 * @description
 * # TrainingSetService
 * Used for manipulating training sets on the server side.
 */
angular.module('intellogoSDK')
    .factory(
    'TrainingSetService',
    function ($http, API_LOCATION, ServiceUtils) {

        /**
         * Returns all training sets.
         * @returns {HttpPromise}
         */
        function getAllTrainingSets() {
            var url = API_LOCATION + '/api/trainingSets/all';
            return $http.get(url);
        }

        /**
         * Generates training sets for categories.
         * @param categoryId ID of the target category. If you don't provide,
         * all categories will be used for training set creation.
         * @returns {HttpPromise}
         */
        function generateTrainingSets(categoryId) {
            var url = API_LOCATION + '/api/trainingSets/generate' +
                ServiceUtils.constructQueryParameters(
                    {
                        categoryId: categoryId
                    });

            return $http.post(url);
        }

        return {
            generateTrainingSets: generateTrainingSets,
            getAllTrainingSets: getAllTrainingSets
        };
    });
