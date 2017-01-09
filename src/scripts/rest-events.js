/**
 * Holds various event names as constants.
 */
angular.module('intellogoSDK').constant(
    'INTELLOGO_EVENTS', {
        /**
         * The user should be authenticated.
         */
        AUTHENTICATE_PASSWORD: 'event:authenticatePassword',
        /**
         * The user should be authenticated with a client secret.
         */
        AUTHENTICATE_CLIENT_SECRET: 'event:authenticateClientSecret',
        /**
         * There has been a failure during authentication.
         */
        AUTHENTICATION_FAILURE: 'event:authenticationFailure',
        /**
         * The user has been successfully authenticated.
         */
        AUTHENTICATION_SUCCESS: 'event:authenticationSuccess',
        /**
         * The user has made a logout request.
         */
        LOGOUT: 'event:logout',
        /**
         * A smart folder has been added.
         */
        SMART_FOLDER_ADDED: 'event:smartFolderAdded',
        /**
         * A smart folder has been updated.
         */
        SMART_FOLDER_UPDATED: 'event:smartFolderUpdated',
        /**
         * A category has been updated.
         */
        CATEGORY_UPDATED: 'event:categoryUpdated'
    });
