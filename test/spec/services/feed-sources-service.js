'use strict';

describe('Service: FeedSourcesService', function () {
    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var http, FeedSourcesService;
    beforeEach(inject(function (_FeedSourcesService_, $http) {
        FeedSourcesService = _FeedSourcesService_;
        http = $http;
    }));

    it('should get all feed sources', function () {
        spyOn(http, 'get');

        FeedSourcesService.getSources();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/feedSources/'));
    });

    it('should add feed sources', function () {
        spyOn(http, 'post');

        FeedSourcesService.addSource({_id: 'source1'});

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/feedSources/add'),
            {_id: 'source1'});
    });

    it('should update feed sources', function () {
        spyOn(http, 'post');

        FeedSourcesService.updateSource({_id: 'source1'});

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/feedSources/update'),
            {_id: 'source1'});
    });

    it('should remove feed sources', function () {
        spyOn(http, 'delete');

        FeedSourcesService.removeSource('source1337');

        expect(http.delete).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/feedSources/source1337'));
    });

    it('should collect feeds for an URL', function () {
        spyOn(http, 'post');

        FeedSourcesService.collectFeeds('http://fmi.uni-sofia.bg/');

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/feedSources/collect'),
            {url: 'http://fmi.uni-sofia.bg/'});
    });
});
