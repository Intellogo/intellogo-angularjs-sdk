'use strict';

/**
 * @ngdoc service
 * @name rest.CategoryService
 * @description
 * # CategoryService
 * Factory in the rest.
 */
angular.module('rest')
    .factory(
    'CategoryService',
    // jshint maxparams:5
    function ($http, $rootScope, API_LOCATION, REST_EVENTS, ServiceUtils) {
        // jshint maxstatements: 16
        /**
         * Retrieves all categories from the server.
         * @param {String} options.search Search term.
         * @param {String[]} options.statusFilter Filter categories by status.
         * @returns {HttpPromise} Resolved with the results.
         */
        function getAllCategories(options) {
            options = options || {};

            var parameters = {};

            if (options.search) {
                parameters.search = options.search;
            }

            if (options.statusFilter) {
                parameters.status = JSON.stringify(options.statusFilter);
            }

            var resultPromise = $http.get(ServiceUtils.constructServiceUrl(
                'categories',
                'all',
                ServiceUtils.constructQueryParameters(parameters)));

            return resultPromise;
        }

        function getCategoriesMetadata(categoryIds) {
             if (!_.isArray(categoryIds)) {
                categoryIds = [categoryIds];
            }
            var url = ServiceUtils.constructServiceUrl('categories', 'info');
            return $http.post(url, categoryIds);
        }

        function getCategoriesCount() {
            return $http.get(API_LOCATION + '/api/categories/count');
        }

        function getCategoriesRestrictions() {
            return $http.get(API_LOCATION + '/api/categories/restrictions');
        }

        function convertToContentUpdate(categories) {
            return _.map(categories, function (category) {
                return {
                    categoryId : category.categoryId,
                    samples    : category.samples || [],
                    testSamples: category.testSamples || []
                }; });
        }

        /**
         * Associates contents with categories. The contents that should be
         * assigned to a category need to be added as regular entries in the
         * "samples" array of the respective category object.
         * @param {Object[]} categories The target categories.
         * @returns {HttpPromise}
         */
        function associateContentsWithCategory(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            // filter unneeded fields
            return $http.post(API_LOCATION + '/api/categories/assign',
                              convertToContentUpdate(categories));
        }

        /**
         * Deassociates contents with categories. The contents that should be
         * removed from a category need to be removed as entries in the
         * "samples" array of the respective category object.
         * @param {Object[]} categories The target categories.
         * @returns {HttpPromise} Will be resolved when the request has
         * finished.
         */
        function deAssociateContentsWithCategory(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            // filter unneeded fields
            return $http.post(API_LOCATION + '/api/categories/unassign',
                              convertToContentUpdate(categories));
        }

        /**
         * Creates categories on the server. The IDs will be returned when the
         * request is finished.
         * @param {String[]} categoryNames The names of the categories to add.
         * @returns {HttpPromise} Will be resolved when the request has
         * finished.
         */
        function addNewCategories(categoryNames) {
            if (!_.isArray(categoryNames)) {
                categoryNames = [categoryNames];
            }
            var categories = _.map(categoryNames, function (name) {
                return {
                    name: name
                };
            });
            return $http.post(API_LOCATION + '/api/categories/create',
                              categories);
        }

        /**
         * Updates a changed category. Do not use this for adding or removing
         * samples (contents) to/from the category.
         * @param {Object} category The modified category object.
         * @returns {HttpPromise} Will be resolved when the request has
         * finished.
         */
        function saveCategoryChanges(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }

            var response = $http.post(API_LOCATION + '/api/categories/update',
                                      categories);
            response.success(function() {
                $rootScope.$broadcast(REST_EVENTS.CATEGORY_UPDATED);
            });
            return response;
        }

        /**
         * Removes categories from the server.
         * @param {Object[]} categories The target category objects.
         * @returns {HttpPromise}
         */
        function removeCategories(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            categories = _.pluck(categories, 'categoryId');
            return $http.post(API_LOCATION + '/api/categories/delete',
                              categories);
        }

        /**
         *
         * @param {String} categoryId The ID of the category.
         * @param {Number} [count] the number of URLs to be returned
         * @returns {HttpPromise}
         */
        function getCategoryImages(categoryId, count) {
            var obj = {
                id: categoryId
            };

            if (angular.isDefined(count)) {
                obj.count = count;
            }
            return $http.get(API_LOCATION + '/api/categories/contentImages' +
                ServiceUtils.constructQueryParameters(obj));
        }

        /**
         * Retrieves all contents in collection with given name
         * that are part of a category. Will include
         * contents that are added as negative samples.
         * @param {String} categoryId The ID of the category.
         * @param {String} collectionName The name of the contents collection.
         * @returns {HttpPromise}
         */
        function getContentsInCategory(categoryId, collectionName) {
            return $http.post(API_LOCATION + '/api/categories/contents',
                              [
                                  {
                                      categoryId: categoryId,
                                      metadata: true,
                                      collectionName: collectionName
                                  }
                              ]);
        }


        function getDynamicCategories (searchTerm, metadata) {
            metadata = metadata ? metadata: {};
            return $http.post(
                ServiceUtils.constructServiceUrl('categories', 'dynamic'),
                {
                    searchTerm : searchTerm,
                    displayName: metadata.displayName,
                    description: metadata.description,
                    numResults : metadata.numResults
                }
            );
        }

        /**
         * Invalidates categories on the server side. This means that all data
         * associated with the categories (trainings, ratings, etc.) will be
         * removed, but the categories themselves will remain intact.
         * @param {Object[]} categories The category objects.
         * @return {HttpPromise}
         */
        function invalidateCategories(categories) {
            if (!_.isArray(categories)) {
                categories = [categories];
            }
            return $http.post(API_LOCATION + '/api/categories/invalidate',
                              categories);
        }

        /**
         *
         * Saves the changes made. Has five main responsibilities:
         * 1. If there are newly added categories, create them on the server
         *    side. Save their IDs for the next step.
         * 2. Save the changes to any modified categories.
         * 3. Associate all newly added contents with the target categories.
         * 4. Associate all existing contents with the target categories. (e.g.
         * when changing from positive to negative)
         * 5. Remove any existing contents which have been removed as samples
         * from the categories.
         * @param {Array<Object>|Object} categoriesForSaving
         * @param {Object} originalCategoriesData
         * @param callback
         */
        function saveCategoryDataChanges(categoriesForSaving,
                                         originalCategoriesData,
                                         callback) {
            if (!categoriesForSaving) {
                callback(new Error('Categories not selected'));
            }

            if(!_.isArray(categoriesForSaving)) {
                categoriesForSaving = [categoriesForSaving];
            }

            function isCategoryNew(category) {
                return !category.categoryId;
            }

            var newlyAddedCategories =
                _.filter(categoriesForSaving,
                         isCategoryNew);


            function shouldInvalidate(category) {
                category = _.clone(category);
                delete category.categoryId;
                var invalidate = !_.find(newlyAddedCategories, category) &&
                   (category.newContents && category.newContents.length ||
                    category.dirtySamples && category.dirtySamples.length ||
                    category.removedSamples && category.removedSamples.length);
                return !!invalidate;
            }

            function processContentForSaving(content) {
                return {
                    contentId: content._id || content.contentId,
                    positive: content.positive
                };
            }

            /**
             * Creates new categories if the user has added any from the UI.
             * @param callback
             */
            function createNewCategoriesIfNecessary(callback) {
                if (newlyAddedCategories.length > 0) {
                    var namesOfCategoriesForCreation =
                        _.pluck(newlyAddedCategories, 'name');
                    addNewCategories(
                        namesOfCategoriesForCreation)
                        .success(
                        function (savedCategories) {
                            _.each(savedCategories, function (category, index) {
                                newlyAddedCategories[index].categoryId =
                                    category._id;
                            });
                            callback();
                        });
                } else {
                    callback();
                }
            }

            /**
             * Assigns new samples to categories.
             * @param callback
             */
            function assignNewSamples(callback) {
                var categoriesWithNewItems =
                    _.filter(categoriesForSaving,
                        function (category) {
                            return (category.newContents &&
                                category.newContents.length) ||
                                (category.newTestContents &&
                                category.newTestContents.length);
                        });
                var parameters =
                    _.map(categoriesWithNewItems,
                        function (category) {
                            var samples =
                                _.map(category.newContents,
                                    processContentForSaving);
                            var testSamples =
                                _.map(category.newTestContents,
                                    processContentForSaving);
                            return {
                                categoryId: category.categoryId,
                                samples: samples,
                                testSamples: testSamples,
                                invalidate: shouldInvalidate(category)
                            };
                        });

                if (!parameters.length) {
                    callback();
                    return;
                }
                associateContentsWithCategory(parameters)
                    .success(function () {
                        callback();
                    });
            }

            /**
             * Re-assigns existing samples in categories. (e.g. when a sample is
             * changed from positive to negative)
             * @param callback
             */
            function assignExistingSamples(callback) {
                var categoriesWithChangedItems =
                    _.filter(categoriesForSaving,
                        function (category) {
                            return (category.dirtySamples &&
                                category.dirtySamples.length) ||
                                (category.dirtyTestSamples &&
                                category.dirtyTestSamples.length);
                        });
                var parameters =
                    _.map(categoriesWithChangedItems,
                        function (category) {
                            var samples =
                                _.map(category.dirtySamples,
                                    processContentForSaving);
                            var testSamples =
                                _.map(category.dirtyTestSamples,
                                    processContentForSaving);
                            return {
                                categoryId: category.categoryId,
                                samples: samples,
                                testSamples: testSamples,
                                invalidate: shouldInvalidate(category)
                            };
                        });
                if (!parameters.length) {
                    callback();
                    return;
                }
                associateContentsWithCategory(parameters)
                    .success(function () {
                        callback();
                    });
            }

            /**
             * Removes samples associated with existing categories.
             * @param callback
             */
            function removeExistingSamples(callback) {
                var categoriesWithRemovedItems =
                    _.filter(categoriesForSaving,
                        function (category) {
                            return (category.removedSamples &&
                                category.removedSamples.length) ||
                                (category.removedTestSamples &&
                                category.removedTestSamples.length);
                        });
                var parameters =
                    _.map(categoriesWithRemovedItems,
                        function (category) {
                            var samples =
                                _.map(category.removedSamples,
                                    processContentForSaving);
                            var testSamples =
                                _.map(category.removedTestSamples,
                                    processContentForSaving);
                            return {
                                categoryId: category.categoryId,
                                samples: samples,
                                testSamples: testSamples,
                                invalidate: shouldInvalidate(category)
                            };
                        });
                if (!parameters.length) {
                    callback();
                    return;
                }

                deAssociateContentsWithCategory(parameters)
                    .success(function () {
                        callback();
                    });
            }

            /**
             * Edits existing categories which have been changed (e.g., from
             * the name field) in the UI.
             * @param callback
             */
            function updateCategoriesMetadata(callback) {
                var updateMetadataFields = [
                    'name', 'description', 'autoupdate', 'displayName', 'productionReady',
                    'locked', 'useTSVD', 'tags', 'keywords', 'userTrained'
                ];
                var categoriesWithChanges =
                    _(categoriesForSaving)
                        .filter(function (category) {
                            var originalCategory =
                                originalCategoriesData[category.categoryId],
                                categoryNewlyAdded =
                                    newlyAddedCategories.indexOf(category) >= 0,
                                categoryChanged =
                                    !(_.isEqual(category, originalCategory));
                            return categoryChanged || categoryNewlyAdded;
                        })
                        .map(function (category) {
                            var originalCategory =
                                originalCategoriesData[category.categoryId];

                            function isFieldUnchanged(val, key) {
                                return _.isEqual(originalCategory && originalCategory[key],
                                                 val);
                            }

                            // leave only changed fields
                            var categoryChanges =
                                _(category)
                                    .pick(updateMetadataFields)
                                    .omit(isFieldUnchanged)
                                    .value();

                            if (_.isEmpty(categoryChanges)) {
                                // nothing to update ...
                                return null;
                            }

                            categoryChanges.categoryId = category.categoryId;
                            return categoryChanges;
                        })
                        .compact()
                        .value();

                if (!categoriesWithChanges.length) {
                    callback();
                    return;
                }

                async.each(categoriesWithChanges,
                    function (category, asyncCallback) {
                        saveCategoryChanges(category)
                            .success(function () {
                                asyncCallback(null);
                            })
                            .error(function (error) {
                                asyncCallback(error || 'Error');
                            });
                    },
                    callback);
            }

            async.series([
                    createNewCategoriesIfNecessary,
                    updateCategoriesMetadata,
                    assignNewSamples,
                    assignExistingSamples,
                    removeExistingSamples
                ], _.partial(callback, _, newlyAddedCategories));
        }

        return {
            addNewCategories                 : addNewCategories,
            associateContentsWithCategory    : associateContentsWithCategory,
            deAssociateContentsWithCategory  : deAssociateContentsWithCategory,
            getAllCategories                 : getAllCategories,
            getCategoriesMetadata            : getCategoriesMetadata,
            getCategoryImages                : getCategoryImages,
            getCategoriesCount               : getCategoriesCount,
            getCategoriesRestrictions        : getCategoriesRestrictions,
            getDynamicCategories             : getDynamicCategories,
            expandContentsInCategory         : getContentsInCategory,
            removeCategories                 : removeCategories,
            /**
             * @deprecated Use #deAssociateContentsWithCategory instead.
             */
            removeContentsFromCategory  : deAssociateContentsWithCategory,
            saveCategoryChanges         : saveCategoryChanges,
            saveCategoryDataChanges     : saveCategoryDataChanges,
            invalidateCategories        : invalidateCategories
        };
    });
