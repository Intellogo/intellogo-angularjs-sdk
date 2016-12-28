'use strict';

describe('Service: SmartFoldersService', function () {
    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var http, SmartFoldersService;
    beforeEach(inject(function (_SmartFoldersService_, $http) {
        SmartFoldersService = _SmartFoldersService_;
        http = $http;
    }));

    it('should get all smart folders', function () {
        spyOn(http, 'get');

        SmartFoldersService.getAllSmartFolders();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/smartFolders'), {params: {categoryId: undefined}});
    });

    it('should get smart folder images', function () {
        spyOn(http, 'get');

        SmartFoldersService.getSmartFolderImage('foo');

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/smartFolders/image/foo'));
    });

    it('should remove smart folders', function () {
        spyOn(http, 'delete');

        SmartFoldersService.deleteSmartFolder('foo');

        expect(http.delete).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/smartFolders/foo'));
    });

    it('should add smart folders', function () {
        var smartFolders = [
            {
                _id: 'id',
                items: [
                    {
                        value: [13, 37],
                        categoryId: 'fooCat'
                    },
                    {
                        value: [15, 17],
                        contentId: 'fooCont'
                    }
                ]
            }
        ];

        spyOn(http, 'post')
            .and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

        SmartFoldersService.addSmartFolder(smartFolders);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/smartFolders/create'),
            [{
                _id: 'id',
                items: [{
                    min: 13,
                    max: 37,
                    categoryId: 'fooCat'
                }, {
                    min: 15,
                    max: 17,
                    contentId: 'fooCont'
                }]
            }]);
    });

    describe('#updateSmartFolders', function() {
        it('should update smart folders items', function () {
            var smartFolders = [
                {
                    _id: 'id',
                    items: [
                        {
                            value: [13, 37],
                            categoryId: 'fooCat'
                        },
                        {
                            value: [15, 17],
                            contentId: 'fooCont'
                        }
                    ]
                }
            ];

            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

            SmartFoldersService.updateSmartFolders(smartFolders);
            expect(http.post).toHaveBeenCalledWith(
                window.ApiEndpointHelper.getEndpoint('/smartFolders/update'),
                [{
                    _id: 'id',
                    items: [{
                        min: 13,
                        max: 37,
                        categoryId: 'fooCat'
                    }, {
                        min: 15,
                        max: 17,
                        contentId: 'fooCont'
                    }]
                }]);
        });

        it('should update smart folders metadata', function () {
          var smartFolders = [
                {
                    _id: 'id',
                    metadata: {name: 'some'}
                }
            ];

            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

            SmartFoldersService.updateSmartFolders(smartFolders);
            expect(http.post).toHaveBeenCalledWith(
                window.ApiEndpointHelper.getEndpoint('/smartFolders/update'),
                [{
                    _id: 'id',
                    metadata: {name: 'some'}
                }]);
        });

        it('should return error when invalid input', function () {
            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper.mockHttpPromise({}));
            var res = SmartFoldersService.updateSmartFolders(null);

            expect(http.post).not.toHaveBeenCalled();
            expect(typeof res.then).toBe('function');
            expect(typeof res.success).toBe('function');
            expect(typeof res.error).toBe('function');
        });
    });
});
