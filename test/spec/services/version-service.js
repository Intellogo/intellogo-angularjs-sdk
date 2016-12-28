'use strict';

describe('Service: VersionService', function () {

    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var http, q, VersionService, mockResult;

    beforeEach(function () {
        module(function ($provide) {
            http = jasmine.createSpy('http').and.returnValue(
                window.HttpMockHelper.mockHttpPromise('foo'));
            $provide.value('$http', http);
        });
    });

    beforeEach(inject(function (_VersionService_, $q) {
        VersionService = _VersionService_;
        q = $q;
    }));

    it('should get the version', function () {
        VersionService.getVersion();

        expect(http).toHaveBeenCalledWith(
            {
                url: window.ApiEndpointHelper.getRawEndpoint('/version'),
                method: 'GET',
                transformResponse: [jasmine.any(Function)]
            });
    });
});
