'use strict';

describe('Service: UserDataService', function () {
    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var http, UserDataService, UserDataHandler;
    beforeEach(inject(function (_UserDataService_, _UserDataHandler_, $http) {
        UserDataService = _UserDataService_;
        UserDataHandler = _UserDataHandler_;
        http = $http;
    }));

    it('should get current user information', function () {
        spyOn(http, 'get').and.returnValue(
            window.HttpMockHelper.mockHttpPromise(
                {
                    userType: 'typeabc',
                    sourcesRestriction: ['source1', 'source2'],
                    defaultSource: 'source1',
                    categoriesRestriction: ['cat1', 'cat2'],
                    image: 'http://dir.bg/img1.jpg'
                })
        );

        UserDataService.loadUserData();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/currentUser/info'));
        expect(UserDataHandler.getUserType())
            .toEqual('typeabc');
        expect(UserDataHandler.getContentSourcesRestriction())
            .toEqual(['source1', 'source2']);
        expect(UserDataHandler.getDefaultSource())
            .toEqual('source1');
        expect(UserDataHandler.getCategoriesRestriction())
            .toEqual(['cat1', 'cat2']);
        expect(UserDataHandler.getUserImagePath())
            .toEqual('http://dir.bg/img1.jpg');
    });
});
