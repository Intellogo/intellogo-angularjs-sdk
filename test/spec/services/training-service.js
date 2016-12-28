'use strict';

describe('Service: TrainingService', function () {

    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var http, TrainingService;
    beforeEach(inject(function (_TrainingService_, $http) {
        TrainingService = _TrainingService_;
        http = $http;
    }));

    it('should get status', function () {
        spyOn(http, 'get');

        TrainingService.getStatus(1337);

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainings/status'),
            {params: {timeInterval: 1337, includeTaskResults: false}});
    });

    it('should initiate training', function () {
        spyOn(http, 'post');

        TrainingService.initiateTraining('a', 'foo', [['a', 'b'], ['c', 'd']]);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainings/initiate'),
            {
                categoryId: 'a',
                contentSource: ['foo'],
                combinations: [['a', 'b'], ['c', 'd']]
            }
        );

        http.post.calls.reset();

        TrainingService.initiateTraining('a', ['foo']);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainings/initiate'),
            {
                categoryId: 'a',
                contentSource: ['foo']
            }
        );

        http.post.calls.reset();

        TrainingService.initiateTraining('a');

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainings/initiate'),
            {
                categoryId: 'a'
            }
        );
    });

    it('should cancel training', function () {
        spyOn(http, 'post');

        TrainingService.cancelTask('abcd');

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/trainings/cancel'),
            {
                taskIds: [{
                    taskId: 'abcd'
                }]
            }
        );
    });
});
