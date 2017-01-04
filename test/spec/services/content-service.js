'use strict';

describe('Service: ContentService', function () {
    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var http, ContentService;
    beforeEach(inject(function (_ContentService_, $http) {
        ContentService = _ContentService_;
        http = $http;
    }));

    it('should get contents with pagination', function () {
        spyOn(http, 'get');

        ContentService.getAllContentsInCategories(5, 20);
        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/all') +
            '?from=5&to=20');
    });

    it('should get contents with search criteria', function () {
        spyOn(http, 'get');

        ContentService.getAllContentsInCategories(
            5,
            20,
            {categories: [], search: 'foo'});
        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/all') +
            '?from=5&to=20&search=foo');
    });

    it('should get contents with source', function () {
        spyOn(http, 'get');

        ContentService.getAllContentsInCategories(
            5,
            20,
            {categories: [], source: 'Dimitar Birov'});
        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/all') +
            '?from=5&to=20&source=Dimitar%20Birov');
    });

    it('should remove a single content', function () {
        var content1 = {_id: 'foo'};
        spyOn(http, 'post');

        ContentService.removeContents(content1);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/delete'),
            [
                {
                    contentId: 'foo'
                }
            ]);
    });

    it('should remove a single content', function () {
        var content1 = {_id: 'foo'},
            content2 = {_id: 'bar'};
        spyOn(http, 'post');

        ContentService.removeContents([content1, content2]);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/delete'),
            [
                {
                    contentId: 'foo'
                },
                {
                    contentId: 'bar'
                }
            ]);
    });

    it('should get all content sources', function () {
        spyOn(http, 'get');

        ContentService.getAllContentSources();
        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/sources'));
    });

    it('should invoke article ingestion', function () {
        spyOn(http, 'post');

        ContentService.importArticles([{url: 'http://dir.bg/'}]);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/importArticles'),
            {
                dataForImport:[{
                    url: 'http://dir.bg/'
                }]
            });
    });

    it('should update content tree metadata', function () {
        spyOn(http, 'post');

        ContentService.updateContentTreeMetadata('contentAbc', {a: 'b'});

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/tree/metadata'),
            {contentId: 'contentAbc', metadata: {a: 'b'}});
    });

    it('should get content descendants', function () {
        spyOn(http, 'get');

        ContentService.getContentDescendants('contentAbc');

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/tree?contentId=contentAbc'));
    });

    it('should import captions', function () {
        spyOn(http, 'post');

        ContentService.importCaptions('http://fmi.uni-sofia.bg/', true, false);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/initiateChannelImportTask'),
            {
                channel: 'http://fmi.uni-sofia.bg/',
                autoSub: true,
                refreshAll: false
            });
    });

    it('should get contents by ID', function () {
        spyOn(http, 'post');

        ContentService.getContentsByIds(['a', 'b', 'c']);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/metadata/all'),
            [
                {
                    contentId: 'a'
                },
                {
                    contentId: 'b'
                },
                {
                    contentId: 'c'
                }
            ]);
    });

    it('should get all top level contents', function () {
        spyOn(http, 'get');

        ContentService.getAllTopLevelContents(13,
                                              37,
                                              {
                                                  search: 'ab',
                                                  source: 'bc',
                                                  foo: 'baz'
                                              });

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/contents/topLevel?from=13&to=37&search=ab&source=bc'));
    });
});
