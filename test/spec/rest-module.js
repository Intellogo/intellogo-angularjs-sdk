'use strict';

describe('RestModule', function () {

    // load the controller's module
    beforeEach(module('intellogoSDK'));

    it('should decorate the $q promises with "success"', function (done) {
        inject(function ($q ,$rootScope) {
            var deferred = $q.defer(),
                promise = deferred.promise,
                data = {};

            promise.success(function(successData, additionalArgument) {
                expect(successData).toBe(data);
                expect(additionalArgument).toBeFalsy();
                done();
            });

            deferred.resolve(data, 'junk');
            $rootScope.$apply();
        });
    });

    it('should decorate the $q promises with "error"', function (done) {
        inject(function ($q ,$rootScope) {
            var deferred = $q.defer(),
                promise = deferred.promise,
                error = {};

            promise.error(function(successData, additionalArgument) {
                expect(successData).toBe(error);
                expect(additionalArgument).toBeFalsy();
                done();
            });

            deferred.reject(error, 'junk');
            $rootScope.$apply();
        });
    });
});
