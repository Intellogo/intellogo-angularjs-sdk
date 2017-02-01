'use strict';

beforeEach(function () {
    angular.module('intellogoSDK')
        .run(function (AuthService) {
            AuthService.setClientCredentials('testApplication', 'ChuckNorris');
        })
        .constant('INTELLOGO_API_LOCATION', '');
});
