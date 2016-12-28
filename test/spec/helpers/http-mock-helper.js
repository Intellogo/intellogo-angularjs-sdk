'use strict';

/**
 * Helper for mocking HTTP service responses.
 * @type {{mockHttpPromise: Function}}
 */
window.HttpMockHelper = {
    /**
     * Mocks a HTTP promise synchronously.
     * @param mockSuccess Data to pass to the success callback.
     * @param [mockError] Data to pass to the error callback.
     * @returns {Promise}
     */
    mockHttpPromise: function (mockSuccess, mockError) {
        return {
            success: function (cb) {
                cb(mockSuccess);
                return this;
            },
            error: function (cb) {
                if (mockError) {
                    cb(mockError);
                }
                return this;
            },
            then: function (successCb, errorCb) {
                // The callbacks for httpPromise.then
                // expect to be called with an object
                if (mockError) {
                    errorCb({
                        data: mockError
                    });
                } else {
                    successCb({
                        data: mockSuccess
                    });
                }
                return this;
            }
        };
    },
    /**
     * Mock an HTTP promise asynchronously. The callback will be called once
     * the provided promise is resolved/rejected.
     * @param promise The promise that should be used for notifying.
     * @return {Promise}
     */
    mockHttpPromiseAsync: function (promise) {
        var successCallback,
            errorCallback;

        promise.then(
            function () {
                if (successCallback) {
                    successCallback.apply(null, arguments);
                }
            },
            function () {
                if (errorCallback) {
                    errorCallback.apply(null, arguments);
                }
            }
        );

        return {
            success: function (cb) {
                successCallback = cb;
                return this;
            },
            error: function (cb) {
                errorCallback = cb;
                return this;
            }
        };
    }
};

describe('HttpMockHelper', function () {
    /*
     * Yeah, I know testing test helpers looks pretty pointless. Unfortunately,
     * the logic here started to get pretty ugly.
     *
     * Furthermore, the tests here can be used as examples for usage of this
     * helper.
     */
    var HttpMockHelper = window.HttpMockHelper;

    it('should return synchronous mock HTTP promises', function () {
        var mockPromise = HttpMockHelper.mockHttpPromise('foo', 'bar'),
            successResult,
            errorResult;

        mockPromise.success(function (data) {
            successResult = data;
        }).error(function (data) {
            errorResult = data;
        });

        expect(successResult).toEqual('foo');
        expect(errorResult).toEqual('bar');
    });

    it('should return async mock HTTP promises which react to success',
       inject(function ($q, $rootScope) {
           var deferred = $q.defer(),
               promise = deferred.promise,
               mockPromise = HttpMockHelper.mockHttpPromiseAsync(promise),
               successResult,
               errorResult;

           mockPromise.success(function (data) {
               successResult = data;
           }).error(function (data) {
               errorResult = data;
           });

           expect(successResult).toBeUndefined();
           expect(errorResult).toBeUndefined();

           deferred.resolve('foo');
           $rootScope.$apply();

           expect(successResult).toEqual('foo');
           expect(errorResult).toBeUndefined();
       }));

    it('should return async mock HTTP promises which react to errors',
       inject(function ($q, $rootScope) {
           var deferred = $q.defer(),
               promise = deferred.promise,
               mockPromise = HttpMockHelper.mockHttpPromiseAsync(promise),
               successResult,
               errorResult;

           mockPromise.success(function (data) {
               successResult = data;
           }).error(function (data) {
               errorResult = data;
           });

           expect(successResult).toBeUndefined();
           expect(errorResult).toBeUndefined();

           deferred.reject('foo');
           $rootScope.$apply();

           expect(successResult).toBeUndefined();
           expect(errorResult).toEqual('foo');
       }));
});
