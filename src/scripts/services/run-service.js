'use strict';

angular.module('rest').factory(
    'RunService',
    function ($http, API_LOCATION, ServiceUtils) {
        function getAllRuns() {
            return $http.get(API_LOCATION + '/api/runs');
        }

        function removeRun(id) {
            return $http.delete(API_LOCATION + '/api/runs/' + id);
        }

        /**
         * Retrieves the runs associated with a category.
         * @param categoryId The ID of the category.
         * @returns {*}
         */
        function getRunsForCategory(categoryId) {
            return $http.get(API_LOCATION + '/api/runs' +
                             ServiceUtils.constructQueryParameters(
                                 {
                                     categoryId: categoryId
                                 }));
        }

        /**
         * Returns the IDs of all categories that have at least one finished
         * run.
         */
        function getAllCategoriesWithFinishedRuns() {
            return $http.get(API_LOCATION +
                             '/api/runs/categoriesWithFinishedRuns');
        }

        return {
            getAllCategoriesWithFinishedRuns: getAllCategoriesWithFinishedRuns,
            getAllRuns: getAllRuns,
            getRunsForCategory: getRunsForCategory,
            removeRun: removeRun
        };
    });
