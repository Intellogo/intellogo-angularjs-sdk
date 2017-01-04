'use strict';

describe('Service: CategoryService', function () {
    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var http, CategoryService;
    beforeEach(inject(function (_CategoryService_, $http) {
        CategoryService = _CategoryService_;
        http = $http;
    }));

    describe('CategoryService#getAllCategories', function () {
        it('should retrieve all categories with filtering', function () {
            spyOn(http, 'get').and
                .returnValue(window.HttpMockHelper.mockHttpPromise({}));

            CategoryService.getAllCategories();
            expect(http.get).toHaveBeenCalledWith(
                window.ApiEndpointHelper.getEndpoint('/categories/all'));
        });

        it('should retrieve all categories with filtering by search term',
           function () {
               spyOn(http, 'get').and
                   .returnValue(window.HttpMockHelper.mockHttpPromise({}));

               CategoryService.getAllCategories({
                                                    search: 'boza'
                                                });
               expect(http.get).toHaveBeenCalledWith(
                   window.ApiEndpointHelper.getEndpoint(
                       '/categories/all?search=boza'));
           });

        it('should retrieve all categories with filtering by status',
           function () {
               spyOn(http, 'get').and
                   .returnValue(window.HttpMockHelper.mockHttpPromise({}));

               CategoryService.getAllCategories(
                   {
                       statusFilter: ['status1', 'status2']
                   });
               expect(http.get).toHaveBeenCalledWith(
                   window.ApiEndpointHelper.getEndpoint(
                       '/categories/all?status=%5B%22status1%22%2C%22status2%22%5D'));
           });
    });

    describe('CategoryService#saveCategoryDataChanges', function() {
        /*
          save new category
          update existing
           - samples changes
           - category changes
           - mixed changes
          save both
         */
        var categoryNew = {
            name: 'nov',
            description: 'some',
            newContents: [{contentId: 1, positive: true}]
        }, categoryExisting1 = {
            categoryId: 'id1',
            name: 'ima',
            description: 'some',
            newContents: [{contentId: 1, positive: true}]
        }, categoryExisting2 = {
            categoryId: 'id2',
            name: 'ima',
            description: 'some',
            removedSamples: [{contentId: 1, positive: true}]
        };

        it('should create new categories', function (done) {
            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper
                                     .mockHttpPromise([{_id: 'id'}]));

            function categoryCreatedTest(){
                expect(http.post)
                    .toHaveBeenCalledWith(
                        window.ApiEndpointHelper.getEndpoint('/categories/create'),
                        [{name: 'nov'}]
                    );

                expect(http.post)
                    .toHaveBeenCalledWith(
                        window.ApiEndpointHelper.getEndpoint('/categories/update'),
                        [{
                            categoryId: 'id',
                            name: categoryNew.name,
                            description: categoryNew.description
                        }]
                    );

                expect(http.post)
                    .toHaveBeenCalledWith(
                        window.ApiEndpointHelper.getEndpoint('/categories/assign'),
                        [{
                            categoryId : 'id',
                            samples    : categoryNew.newContents,
                            testSamples: []
                        }]
                    );
                done();
            }

            CategoryService.saveCategoryDataChanges([categoryNew],
                                                    {},
                                                    categoryCreatedTest);
        });

        it('should create update existing category metadata', function (done) {
            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper
                                     .mockHttpPromise([{_id: 'id'}]));

            function categoryCreatedTest() {
                expect(http.post.calls.count()).toEqual(1);

                expect(http.post)
                    .toHaveBeenCalledWith(
                        window.ApiEndpointHelper.getEndpoint('/categories/update'),
                        [{categoryId: 'id', name: 'some', productionReady: undefined}]
                    );

                done();
            }

            CategoryService.saveCategoryDataChanges(
                {
                    categoryId     : 'id',
                    name           : 'some',
                    productionReady: undefined
                }, {
                    id: {
                        categoryId     : 'id',
                        name           : 'any',
                        productionReady: true
                    }
                },
                categoryCreatedTest);
        });

        it('should create update existing category train samples', function (done) {
            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper
                                     .mockHttpPromise([{_id: 'id'}]));

            function categoryCreatedTest() {
                expect(http.post.calls.count()).toEqual(1);

                expect(http.post)
                    .toHaveBeenCalledWith(
                        window.ApiEndpointHelper.getEndpoint('/categories/assign'),
                        [{
                            categoryId : 'id',
                            samples    : [{contentId: '1', positive: true}],
                            testSamples: []
                        }]);

                done();
            }

            CategoryService.saveCategoryDataChanges(
                {
                    categoryId : 'id',
                    name       : 'some',
                    newContents: [{contentId: '1', positive: true}]
                }, {
                    id: {
                        categoryId: 'id',
                        name      : 'some'
                    }
                },
                categoryCreatedTest);
        });

        it('should update existing categories', function (done) {
            spyOn(http, 'post')
                .and.returnValue(window.HttpMockHelper
                                     .mockHttpPromise([{_id: 'id'}]));

                function categoriesUpdatedTest() {
                    expect(http.post.calls.count()).toBe(4);

                    expect(http.post)
                        .toHaveBeenCalledWith(
                            window.ApiEndpointHelper.getEndpoint('/categories/update'),
                            [{
                                description: 'none',
                                categoryId : 'id1',
                            }]);

                    expect(http.post)
                        .toHaveBeenCalledWith(
                            window.ApiEndpointHelper.getEndpoint('/categories/update'),
                            [{
                                name      : 'any',
                                categoryId: 'id2',
                            }]);

                    expect(http.post)
                        .toHaveBeenCalledWith(
                            window.ApiEndpointHelper.getEndpoint('/categories/assign'),
                            [{
                                categoryId : 'id1',
                                samples    : categoryExisting1.newContents,
                                testSamples: []
                            }]
                        );

                    expect(http.post)
                        .toHaveBeenCalledWith(
                            window.ApiEndpointHelper.getEndpoint('/categories/unassign'),
                            [{
                                categoryId : 'id2',
                                samples    : categoryExisting2.removedSamples,
                                testSamples: []
                            }]
                        );
                    done();
                }

            var updated1 = _.clone(categoryExisting1);
            updated1.description = 'none';
            var updated2 = _.clone(categoryExisting2);
            updated2.name = 'any';
            CategoryService.saveCategoryDataChanges([updated1,
                                                     updated2],
                                                    {
                                                        id1: categoryExisting1,
                                                        id2: categoryExisting2
                                                    },
                                                    categoriesUpdatedTest);
        });
    });

    it('should save category changes', function () {
        spyOn(http, 'post').and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

        var category = {};
        CategoryService.saveCategoryChanges(category);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/update'),
            [category]);
    });

    it('should de-associate contents from categories', function () {
        spyOn(http, 'post');

        var categories = [];
        CategoryService.deAssociateContentsWithCategory(categories);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/unassign'),
            categories);
    });

    it('should delete categories', function () {
        spyOn(http, 'post');

        var category1 = {categoryId: 'id1'},
            category2 = {categoryId: 'id2'};
        CategoryService.removeCategories(category1);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/delete'),
            ['id1']);
        CategoryService.removeCategories([category1, category2]);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/delete'),
            ['id1', 'id2']);
    });

    it('should invalidate categories', function () {
        spyOn(http, 'post');

        var category1 = {},
            category2 = {};
        CategoryService.invalidateCategories(category1);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/invalidate'),
            [category1]);
        CategoryService.invalidateCategories([category1, category2]);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/invalidate'),
            [category1, category2]);
    });

    it('should assign samples to categories', function () {
        spyOn(http, 'post');

        var categories = [{categoryId: 'foo', name: 'some'}, {categoryId: 'bar'}];
        CategoryService.associateContentsWithCategory(categories);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/assign'),
            [{
                categoryId: 'foo',
                samples: [],
                testSamples: []
            }, {
                categoryId: 'bar',
                samples: [],
                testSamples: []
            }]);
    });

    it('should assign samples to a category', function () {
        spyOn(http, 'post');

        var category = { categoryId: 'bar' };
        CategoryService.associateContentsWithCategory(category);
        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/assign'),
            [{
                categoryId: 'bar',
                samples: [],
                testSamples: []
            }]);
    });

    it('should get contents from a category', function () {
        spyOn(http, 'post');

        CategoryService.expandContentsInCategory('abc', 'samples');

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/contents'),
            [
                {
                    categoryId: 'abc',
                    metadata: true,
                    collectionName: 'samples'
                }
            ]);
    });

    it('should de-associate contents with categories', function () {
        spyOn(http, 'post');

        CategoryService.deAssociateContentsWithCategory([
                                                            {
                                                                categoryId: 'bar'
                                                            },
                                                            {
                                                                categoryId: 'baz'
                                                            }
                                                        ]);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/unassign'),
            [
                {
                    categoryId: 'bar',
                    samples: [],
                    testSamples: []
                },
                {
                    categoryId: 'baz',
                    samples: [],
                    testSamples: []
                }
            ]);
    });

    it('should de-associate contents with a single category', function () {
        spyOn(http, 'post');

        CategoryService.deAssociateContentsWithCategory(
                                                            {
                                                                categoryId: '1',
                                                                samples: ['c2']
                                                            }
                                                        );

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/categories/unassign'),
            [
                {
                    categoryId: '1',
                    samples: ['c2'],
                    testSamples: []
                }
            ]);
    });
});
