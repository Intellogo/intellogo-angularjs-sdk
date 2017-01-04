'use strict';

describe('Service: RatingService', function () {

    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var http, RatingService, FileDownloadDialogService;
    beforeEach(inject(function (_RatingService_, _FileDownloadDialogService_, $http) {
        RatingService = _RatingService_;
        FileDownloadDialogService = _FileDownloadDialogService_;
        http = $http;
    }));

    it('should get ratings', function () {
        var params = {
            runId: 'run1',
            source: 'foo',
            from: 10,
            to: 130
        };

        spyOn(http, 'get');

        RatingService.getRatings('456', params);

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/rating/categoryBest' +
                '?categoryId=456&content=%7B%22source%22%3A%22foo%22%7D&runId=run1&from=10&to=130'));
    });

    it('should get ratings for smart folders', function () {
        var smartFolder = {
                items: [
                    {
                        categoryId: 'cat1'
                    },
                    {
                        categoryId: 'cat2',
                        value: [25, 70]
                    }
                ]
            },
            options = {recommendationSources: 'foo'},
            from = 10,
            to = 130;

        spyOn(http, 'get');

        RatingService.getRatingsForSmartFolder(smartFolder, false,'', options, from, to);

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/smartFolders/ratings' +
                '?smartFolderItem=%7B%22min%22%3A0%2C%22max%22%3A100%2C%22categoryId%22%3A%22cat1%22%7D&smartFolderItem=%7B%22min%22%3A25%2C%22max%22%3A70%2C%22categoryId%22%3A%22cat2%22%7D&metadataFilter=%7B%22source%22%3A%22foo%22%7D&from=10&to=130'));
    });

    it('should count ratings for smart folders', function () {
        var smartFolder = {
                items: [
                    {
                        categoryId: 'cat1'
                    },
                    {
                        categoryId: 'cat2',
                        value: [25, 70]
                    }
                ]
            };

        spyOn(http, 'get');

        RatingService.countRatingsForSmartFolder(smartFolder);

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/smartFolders/ratingsCount' +
                '?smartFolderItem=%7B%22min%22%3A0%2C%22max%22%3A100%2C%22categoryId%22%3A%22cat1%22%7D&smartFolderItem=%7B%22min%22%3A25%2C%22max%22%3A70%2C%22categoryId%22%3A%22cat2%22%7D'));
    });

    it('should reject to get ratings for multiple categories', function () {
        var categories = ['a', 'b'];
        expect(function () {
            var params = {
                source: 'fp',
                from: 0,
                to: 30
            };
            RatingService.getRatings(categories, params);
        }).toThrow(jasmine.any(Error));
    });

    it('should get ratings as CSV', function () {
        var category = '456';

        spyOn(FileDownloadDialogService, 'downloadFileInNewWindow');

        RatingService.getRatingsAsCSV(category);

        expect(FileDownloadDialogService.downloadFileInNewWindow).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/rating/categoryBestCSV' +
                '?categoryId=456'));
    });

    it('should get category ratings for contents', function () {
        spyOn(http, 'get')
            .and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

        RatingService.getCategoryRatingsForContent('foo');

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/rating/contentCategoryRatings' +
                '?contentId=foo'));
    });

    it('should get content ratings (with initiate) for contents', function () {
        spyOn(http, 'post');

        RatingService.getContentRatingsForContentInitiateTraining(
            {
                contentId: 'foo',
                recommendationsSource: 'boo',
                itemsToRate: [{source: 'moo'}]
            }
        );

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/rating/contentBest'),
            {
                contentId: 'foo',
                contentsToRate: {
                    source: 'boo'
                },
                itemsToRate: [{
                    source: 'moo'
                }]
            });
    });

    it('should get content ratings (with initiate) for contents within ranges', function () {
        spyOn(http, 'post');

        RatingService.getContentRatingsForContentInitiateTraining(
            {
                contentId: 'foo',
                recommendationsSource: 'boo',
                itemsToRate: [{source: 'moo'}],
                from: 20,
                to: 30
            }
        );

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/rating/contentBest'),
            {
                contentId: 'foo',
                from: 20,
                to: 30,
                contentsToRate: {
                    source: 'boo'
                },
                itemsToRate: [{
                    source: 'moo'
                }]
            });
    });

    it('should get content ratings for contents', function () {
        spyOn(http, 'get');

        RatingService.getContentRatingsForContent({contentId: 'foo'});

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/rating/contentBest?contentId=foo'));
    });

    it('should get content ratings for contents within ranges', function () {
        spyOn(http, 'get');

        RatingService.getContentRatingsForContent(
            {
                contentId: 'foo',
                recommendationsSource: 'boo',
                from: 20,
                to: 30
            });

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/rating/contentBest?contentId=foo&from=20&to=30&contentsToRate=%7B%22source%22%3A%22boo%22%7D'));
    });

    it('should reject to get ratings as CSV for multiple categories', function () {
        var categories = ['a', 'b'];
        expect(function () {
            RatingService.getRatingsAsCSV(categories, 'fp');
        }).toThrow(jasmine.any(Error));
    });

    it('should remove single ratings', function () {
        var rating = {_id: 'abc'};

        spyOn(http, 'post');

        RatingService.removeRatings(rating);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/rating/delete'),
            [
                {
                    ratingId: 'abc'
                }
            ]);
    });

    it('should remove single ratings', function () {
        var rating1 = {_id: 'abc'},
            rating2 = {_id: 'def'};

        spyOn(http, 'post');

        RatingService.removeRatings([rating1, rating2]);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/rating/delete'),
            [
                {
                    ratingId: 'abc'
                },
                {
                    ratingId: 'def'
                }
            ]);
    });

    it('should delete CvC ratings', function () {
        var contentId = 'foo';

        spyOn(http, 'delete');

        RatingService.removeContentRatingsForContent([contentId]);

        expect(http.delete).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/rating/contentBest?contentId=foo'));
    });

    it('should delete all CvC ratings', function () {
        spyOn(http, 'post');

        RatingService.removeAllContentToContentRatings();

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/rating/removeAllContentBest'));
    });
});
