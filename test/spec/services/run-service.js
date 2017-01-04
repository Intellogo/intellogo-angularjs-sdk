'use strict';

describe('Service: RunService', function () {

    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var http, RunService;
    beforeEach(inject(function (_RunService_, $http) {
        RunService = _RunService_;
        http = $http;
    }));

    it('should get all runs from the database', function () {
        spyOn(http, 'get');

        RunService.getAllRuns();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/runs'));
    });

    it('should remove runs', function () {
        spyOn(http, 'delete');

        RunService.removeRun('foo');

        expect(http.delete).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/runs/foo'));
    });

    it('should get the runs for a category', function () {
        spyOn(http, 'get');

        RunService.getRunsForCategory('aaa');

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/runs?categoryId=aaa'));
    });

    it('should get all categories with finished runs', function () {
        spyOn(http, 'get');

        RunService.getAllCategoriesWithFinishedRuns();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/runs/categoriesWithFinishedRuns'));
    });
});
