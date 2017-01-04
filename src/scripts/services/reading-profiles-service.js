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
      //jshint maxparams: 5
      function ($http, RatingService,
                ServiceUtils, API_LOCATION) {


        /**
         * Creates a category from the items in the profile saves it and
         * adds it to the profile; Saves the so created profile.
         * In case the profile hasn't been changed, its categoryId is returned.
         * @param profile
         * @param callback
         */
        function saveProfileWithCategoryIfNecessary (profile, callback) {
            var contentIdsToAssign =
                    _.pluck(profile.assignedContents, '_id'),
                contentIdsToUnassign =
                    _.pluck(profile.unassignedContents, '_id'),
                contentsChanged =
                    contentIdsToAssign.length > 0 ||
                    contentIdsToUnassign.length > 0,
                nameChanged = profile.originalName !== profile.name,
                returnedProfile = _.clone(profile);

            // Reset change fields
            returnedProfile.assignedContents = [];
            returnedProfile.unassignedContents = [];
            returnedProfile.originalName = returnedProfile.name;

            if (profile._id && !contentsChanged && !nameChanged) {
                // Nothing to do;
                callback(null, profile);
                return;
            }


            var profileForSave = {
                _id: profile._id,
                name: profile.name,
                contentIdsToAssign: contentIdsToAssign.length > 0 ?
                                    contentIdsToAssign: [],
                contentIdsToUnassign: contentIdsToUnassign.length > 0 ?
                                    contentIdsToUnassign: []
            };

            function saveProfileChanges (profileForSave) {
                saveProfile(profileForSave)
                     /*
                     saveResult can be
                      * the profile data of the newly created profile
                      * { success: true } object
                      */
                    .success(function (saveResult) {
                        /*
                         * Set categoryId
                         * Set the id in case of new profile ,
                         * so that the profile is recognized
                         * in the future (on next save)
                         */
                        if (profileForSave._id) {
                            getProfileData(profileForSave._id)
                                .success(function (profileData) {
                                    returnedProfile.categoryId =
                                        profileData.categoryId;
                                    callback(null, returnedProfile);
                                });
                        } else {
                            if (_.isArray(saveResult) &&
                                saveResult[0]) {
                            saveResult = saveResult[0];
                            returnedProfile._id = saveResult;
                            }
                            callback(null, returnedProfile);
                        }
                    })
                    .error(callback);
            }

            saveProfileChanges(profileForSave);
        }

        function saveProfile(profile) {
            // In case the profile exists, just update it
            if (profile._id) {
                return updateProfile(profile);
            } else {
                var newProfile = {
                    name: profile.name,
                    contents: profile.contentIdsToAssign
                };
                return addProfile(newProfile);
            }
        }

        function removeProfiles (profileIds) {
            if (!_.isArray(profileIds)) {
                profileIds = [profileIds];
            }

            return $http.post(API_LOCATION + '/api/profiles/remove',
                              profileIds);
        }

        function addProfile (profile) {
            return $http.post(API_LOCATION + '/api/profiles/add',
                              [profile]);
        }

          function getProfileData (profileId) {
              var url = ServiceUtils.constructServiceUrl('profiles',
                                                         'contentsCount') +
                        ServiceUtils.constructQueryParameters(
                            {
                                profileId: profileId
                            });

              return $http.get(url);
          }


        function updateProfile(profile) {
            var params = {
                profileId: profile._id,
                profileData: {
                    name: profile.name,
                    contentIdsToUnassign: profile.contentIdsToUnassign,
                    contentIdsToAssign: profile.contentIdsToAssign
                }
            };
            return $http.post(API_LOCATION + '/api/profiles/update',
                params);
        }

        function loadProfiles() {
            return $http.get(API_LOCATION + '/api/profiles/all');
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
            saveProfileWithCategory : saveProfileWithCategoryIfNecessary,
            loadProfiles            : loadProfiles,
            loadProfileContents     : loadProfileContents,
            getProfileContentsCount : getProfileContentCount,
            analyzeProfile          : analyzeProfile,
            removeProfiles          : removeProfiles,
            categoryCombinations    : categoryCombinations
        };
  });
