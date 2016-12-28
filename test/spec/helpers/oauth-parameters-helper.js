'use strict';

beforeEach(function () {
    angular.module('rest')
        .constant('OAUTH_CLIENT_ID', 'testApplication')
        .constant('OAUTH_CLIENT_SECRET', 'ChuckNorris')
        .constant('INTELLOGO_API_LOCATION', '');
});
