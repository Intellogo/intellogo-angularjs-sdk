'use strict';

/**
 * @ngdoc service
 * @name rest.TrainingService
 * @description
 * # TrainingService
 * Service for trainings manipulation.
 */
angular.module('rest')
    .factory(
    'TrainingService',
    function ($http, ServiceUtils) {
        /**
         * Initiates a training job on the server.
         * @param categoryIds The ID of the category to use for training.
         * @param [sources] The content sources to use for rating. The contents
         * will be filtered by its value.
         * @param [combinations] Algorithm/fingerprint combinations to use for
         * training. Useful for partial training.
         * @returns {HttpPromise}
         */
        function initiateTraining(categoryId, sources, combinations) {
            var parameters = {
                categoryId: categoryId
            };

            if (sources) {
                if (!_.isArray(sources)) {
                    sources = [sources];
                }
                parameters.contentSource = sources;
            }

            if (combinations) {
                parameters.combinations = combinations;
            }

            return $http.post(ServiceUtils
                                  .constructServiceUrl('trainings','initiate'),
                              parameters);
        }

        /**
         * Returns the status of the current training operations.
         * @returns {HttpPromise}
         */
        function getStatus(timeInterval, taskTypes, includeTaskResults) {
            var params = {
                timeInterval: timeInterval,
                includeTaskResults: !!includeTaskResults
            };
            if (_.isArray(taskTypes) && taskTypes.length > 0) {
                params.taskTypes = taskTypes;
            }

            return $http.get(ServiceUtils
                                 .constructServiceUrl('trainings', 'status'),
                             {params: params});
        }

        /**
         * Returns the status of the current training operations.
         * @returns {HttpPromise}
         */
        function getTaskById(taskId) {
            return $http.get(ServiceUtils
                             .constructServiceUrl('trainings','taskStatus'), {
                                 params : { taskId: taskId }
                             });
        }

        /**
         * Cancels a task by ID.
         * @param taskId The ID of the target task.
         * @param [requestId] The requestId received when the task was initiated
         * @returns {HttpPromise}
         */
        function cancelTask(taskId, requestId ) {
            var url = ServiceUtils.constructServiceUrl('trainings', 'cancel'),
                taskInfo = {taskId: taskId},
                args;
            if (requestId) {
                taskInfo.requestId = requestId;
            }

            args = {
                    taskIds: [taskInfo]
            };

            return $http.post(url, args);
        }

        return {
            cancelTask       : cancelTask,
            getStatus        : getStatus,
            getTaskById      : getTaskById,
            initiateTraining : initiateTraining
        };
    });
