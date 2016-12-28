'use strict';

/**
 * @ngdoc service
 * @name rest.TokenHandler
 * @description
 * # TokenHandler
 * Handles access tokens.
 */
angular.module('rest').factory(
    'UserDataHandler',
    function (LocalStorageBackedVariable) {
        var contentSourcesRestriction =
                LocalStorageBackedVariable.createHolder('content_sources'),
            defaultSource =
                LocalStorageBackedVariable.createHolder('default_source'),
            categoriesRestriction =
                LocalStorageBackedVariable.createHolder('categories'),
            userType =
                LocalStorageBackedVariable.createHolder('user_type'),
            userImage = LocalStorageBackedVariable.createHolder('image_path'),
            eulaAccepted =
                LocalStorageBackedVariable.createHolder('eula_accepted');

        return {
            /**
             * Sets a new value for the contentSourcesRestriction.
             * @param {String[]} sources The sources restriction for the user
             */
            setContentSourcesRestriction: contentSourcesRestriction.setValue,
            /**
             * @returns {String[]} sources The sources restriction for the user
             */
            getContentSourcesRestriction: contentSourcesRestriction.getValue,
            /**
             * Sets a new value for the defaultSource.
             * @param {String} source The default source for the user
             */
            setDefaultSource: defaultSource.setValue,
            /**
             * @returns {String} source The default source for the user
             */
            getDefaultSource: defaultSource.getValue,
            /**
             * Sets a new value for the categories restrictions.
             * @param {String[]} tags The categories restriction for the user
             */
            setCategoriesRestriction: categoriesRestriction.setValue,
            /**
             * @returns {String[]} tags The categories restriction for the user
             */
            getCategoriesRestriction: categoriesRestriction.getValue,
            /**
             * Set the path of the user logo
             * @param {String} logoPath
             */
            setUserImagePath: userImage.setValue,
            /**
             * @returns {String} logoPath Where the user logo is located
             */
            getUserImagePath: userImage.getValue,
            /**
             * @param {String} userType The type of the current user.
             */
            setUserType: userType.setValue,
            /**
             * @returns {String} The type of the current user.
             */
            getUserType: userType.getValue,
            /**
             * @param {Boolean} accepted Whether the user has accepted the EULA
             */
            setEULAAccepted: eulaAccepted.setValue,
            /**
             * @returns {Boolean} Whether the user has accepted the EULA
             */
            getEULAAccepted: eulaAccepted.getValue,

            resetValues: function () {
                userType.setValue(null);
                contentSourcesRestriction.setValue([]);
                categoriesRestriction.setValue([]);
                defaultSource.setValue(null);
                userImage.setValue(null);
                // do not reset the eula value
                // it is not tied to the user currently
            }
        };
    });
