'use strict';

describe('Service: CaptionsService', function () {
    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var http, CaptionsService;
    beforeEach(inject(function (_CaptionsService_, $http) {
        CaptionsService = _CaptionsService_;
        http = $http;
    }));

    it('should get all channels', function () {
        spyOn(http, 'get');

        CaptionsService.getAllChannels();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/captions/channels'));
    });
});
