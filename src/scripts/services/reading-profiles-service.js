'use strict';

/**
 * @ngdoc service
 * @name rest.readingProfilesService
 * @description
 * # readingProfiles
 * Service in the rest.
 */
angular.module('intellogoSDK')
  .service('ReadingProfilesService',
      function ($http, RatingService, ServiceUtils) {

          /**
           * Save changes to the given profile, or adds it to the Intellogo system if a new one.
           * Changes to the profile's contents list require a Content object that has at least a
           * _id property.
           * @param {Object} profile The profile to save
           * @param {String} [profile._id] The id of the profile to update, if it exists.
           * @param {String} profile.clientReference The client reference value for the profile.
           * @param {Boolean} profile.autoupdateCategory
           * @param {Boolean} profile.autoupdateCombinations
           * @param {Array<Content>} profile.assignedContents An array of new contents to assign
           * to a profile. Content already included in the profile does not need to be specified
           * and will not be removed (unless it is included in the unassignedContents parameter).
           * @param {Array<Content>} profile.unassignedContents An array of content entities to
           * remove from the reading profile definition.
           * @param {Function} callback Will be called after the profile is saved, or if an error
           * occurs. If successful, the callback will be called with the profile data, with its
           * _id field set.
           */
          function saveProfile (profile, callback) {
            var contentIdsToAssign =
                    _.pluck(profile.assignedContents, '_id'),
                contentIdsToUnassign =
                    _.pluck(profile.unassignedContents, '_id'),
                returnedProfile = _.clone(profile);

            var profileForSave = _.pick(profile, [
                '_id',
                'clientReference',
                'autoupdateCategory',
                'autoupdateCombinations',
            ]);
              profileForSave.contentIdsToAssign = contentIdsToAssign;
              profileForSave.contentIdsToUnassign = contentIdsToUnassign;

            addOrUpdateProfile(profileForSave)
            /*
              saveResult can be
              * the profile data of the newly created profile
              * or a { success: true } object in case of update
              */
                .success(function (saveResult) {
                    if (!profileForSave._id) {
                        /*
                         * Set the id in case of new profile,
                         * so that the profile is recognized
                         * in the future (on next save)
                         */
                        if (_.isArray(saveResult) &&
                            saveResult[0]) {
                            saveResult = saveResult[0];
                            returnedProfile._id = saveResult._id;
                        }
                    }
                    callback(null, returnedProfile);

                })
                .error(callback);
        }

        function addOrUpdateProfile(profile) {
            // In case the profile exists, just update it
            if (profile._id) {
                return updateProfile(profile);
            } else {
                profile.contents = profile.contentIdsToAssign;
                delete profile.contentIdsToAssign;
                delete profile.contentIdsToUnassign;

                return addProfile(profile);
            }
        }

        function removeProfiles (profileIds) {
            if (!_.isArray(profileIds)) {
                profileIds = [profileIds];
            }

            return $http.post(ServiceUtils.constructServiceUrl('profiles', 'remove'),
                              profileIds);
        }

        function addProfile (profile) {
            return $http.post(ServiceUtils.constructServiceUrl('profiles', 'create'),
                              [profile]);
        }

        function updateProfile(profile) {
            var params = {
                profileId: profile._id,
                profileData: profile
            };
            delete params.profileData._id;
            return $http.post(ServiceUtils.constructServiceUrl('profiles', 'update'),
                              params);
        }

        function loadProfiles() {
            return $http.get(ServiceUtils.constructServiceUrl('profiles', 'all'));
        }

        function loadProfileContents(profileId, loadMetadata, from, to) {
            var queryParams = {
                profileId: profileId,
                metadata: loadMetadata,
                from: from,
                to: to
            };

            var url = ServiceUtils.constructServiceUrl('profiles', 'contents') +
                      ServiceUtils.constructQueryParameters(queryParams);

            return $http.get(url);
        }

        /**
         * Returns a category-content map for the analyzed profile.
         * Use contents as it could be an not unexisting (new) profile.
         * @param profile
         * @param profile.contents
         * @param profile._id
         * @returns
         * {categoryId: {
         *    categoryData: {
         *        _id: {String},
         *        name: {String},
         *        displayName: {String},
         *        productionReady: {Boolean}
         *        },
         *    contents: [contentId1, ...,]
         *    }
         * }
         */
        function analyzeProfile(profile, minScore, productionReady) {
            var profileId, contentIds;
            /*
             We need either profile id (in case of loaded profile
             or content ids in case of new.
             */
            if (profile._id) {
                profileId = profile._id;
            } else {
                contentIds = _.pluck(profile.contents, '_id');
            }

            return RatingService
                .getCategoryRatingMapForContents(profileId,
                                                 contentIds,
                                                 minScore,
                                                 productionReady);
        }

        function categoryCombinations (profile, params) {
            params = _.clone(params, true);

            if (profile._id) {
                params.profileId = profile._id;
            } else {
                params.contentIds = _.pluck(profile.contents, '_id');
            }

            var url = ServiceUtils.constructServiceUrl('profiles',
                                                       'categoryCombinations');
            return $http.post(url,
                              params);
        }

        function getProfileContentCount(profile) {
            var queryParams = {
                profileId: profile._id
            };

            var url = ServiceUtils.constructServiceUrl('profiles',
                                                       'contentsCount') +
                      ServiceUtils.constructQueryParameters(queryParams);

            return $http.get(url);
        }

        return {
            saveProfile             : saveProfile,
            loadProfiles            : loadProfiles,
            loadProfileContents     : loadProfileContents,
            getProfileContentsCount : getProfileContentCount,
            analyzeProfile          : analyzeProfile,
            removeProfiles          : removeProfiles,
            categoryCombinations    : categoryCombinations
        };
  });
