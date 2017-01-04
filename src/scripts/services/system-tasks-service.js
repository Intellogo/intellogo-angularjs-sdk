'use strict';

/**
 * @ngdoc service
 * @name rest.CategoryService
 * @description
 * # SystemTasksService
 * Factory in the rest.
 */
angular.module('intellogoSDK')
    .factory(
        'SystemTasksService',
        // jshint maxparams:5
        function ($http, API_LOCATION, ServiceUtils) {
            var INSIGHTS_UPDATE_TASK                   = {
                    id      : 'system-categories-update',
                    name    : 'Insights Update',
                    endpoint: 'initiateCategoriesUpdate'
                },
                SMART_COLLECTIONS_CACHE_UPDATE_TASK    = {
                    id      : 'system-smart-folder-cache-update',
                    name    : 'Smart Collections Cache Update',
                    endpoint: 'initiateSmartFoldersCacheUpdate'
                },
                SMART_COLLECTIONS_CONTENTS_UPDATE_TASK = {
                    id      : 'system-smart-folder-contents-update',
                    name    : 'Smart Collections Contents Update',
                    endpoint: 'initiateSmartFolderContentsUpdate'
                },
                RSS_INGESTION_TASK                     = {
                    id      : 'system-rss-ingestion',
                    name    : 'RSS Ingestion',
                    endpoint: 'initiateRssIngestion'
                },
                CONTENT_CLEANUP_TASK                   = {
                    id      : 'system-content-cleanup',
                    name    : 'Content Cleanup',
                    endpoint: 'initiateContentCleanup'
                },
                PROFILES_UPDATE_TASK                   = {
                    id      : 'system-profiles-update',
                    name    : 'Profiles Update',
                    endpoint: 'initiateProfilesUpdate'
                },
                YOUTUBE_CHANNELS_UPDATE_TASK           = {
                    id      : 'system-channels-update',
                    name    : 'Youtube Channels Update',
                    endpoint: 'initiateYoutubeChannelsUpdate'
                },
                DYNAMIC_INSIGHTS_CLEANUP_TASK          = {
                    id      : 'system-dynamic-categories-cleanup',
                    name    : 'Dynamic Insights Cleanup',
                    endpoint: 'initiateDynamicInsightsCleanup'
                },
                CLEAN_ALL_STALE_CONTENT_TASK          = {
                    id      : 'all-sources-cleanup-task',
                    name    : 'Rss Content Cleanup',
                    endpoint: 'cleanStaleContent'
                },
                ALL_SYSTEM_TASKS                       = [
                    INSIGHTS_UPDATE_TASK,
                    RSS_INGESTION_TASK,
                    SMART_COLLECTIONS_CONTENTS_UPDATE_TASK,
                    SMART_COLLECTIONS_CACHE_UPDATE_TASK,
                    PROFILES_UPDATE_TASK,
                    CONTENT_CLEANUP_TASK,
                    YOUTUBE_CHANNELS_UPDATE_TASK,
                    DYNAMIC_INSIGHTS_CLEANUP_TASK,
                    CLEAN_ALL_STALE_CONTENT_TASK
                ];

            function getSystemTaskTypes() {
                return ALL_SYSTEM_TASKS;
            }

            function initiateSystemTask(task) {
                if (task.endpoint) {
                    return $http.post(
                        ServiceUtils.constructServiceUrl('/admin/system',
                                                         task.endpoint));
                } else {
                    console.log('Could not initialize ' +
                                'unknown system task ' + task);
                    return undefined;
                }
            }

            return {
                getSystemTaskTypes: getSystemTaskTypes,
                initiateSystemTask: initiateSystemTask
            };
        });
