'use strict';

describe('Service: TrainingSetService', function () {

    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var http, TrainingSetService;
    beforeEach(inject(function (_TrainingSetService_, $http) {
        TrainingSetService = _TrainingSetService_;
        http = $http;
    }));

    it('should return all training sets', function () {
        spyOn(http, 'get');

        TrainingSetService.getAllTrainingSets();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainingSets/all'));
    });

    it('should generate training sets', function () {
        spyOn(http, 'post');

        TrainingSetService.generateTrainingSets('abc');

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainingSets/generate' +
                                                 '?categoryId=abc'));
    });
});
