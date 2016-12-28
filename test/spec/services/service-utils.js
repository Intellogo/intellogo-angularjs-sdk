'use strict';

describe('Service: ServiceUtils', function () {

    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var ServiceUtils,
        INTELLOGO_API_LOCATION;

    beforeEach(inject(function (_ServiceUtils_, _INTELLOGO_API_LOCATION_) {
        ServiceUtils = _ServiceUtils_;
        INTELLOGO_API_LOCATION = _INTELLOGO_API_LOCATION_;
    }));

    it('should construct query strings with simple parameters', function () {
        expect(ServiceUtils.constructQueryParameters({}))
            .toEqual('');
        expect(ServiceUtils.constructQueryParameters(
            {
                a: 5,
                b: 7
            }))
            .toEqual('?a=5&b=7');
        expect(ServiceUtils.constructQueryParameters(
            {
                a: true,
                b: 7
            }))
            .toEqual('?a=true&b=7');
    });

    it('should construct query strings with lists', function () {
        expect(ServiceUtils.constructQueryParameters(
            {
                a: [],
                b: 7,
                c: []
            }))
            .toEqual('?b=7');
        expect(ServiceUtils.constructQueryParameters(
            {
                a: [1, 2, 5],
                b: 7
            }))
            .toEqual('?a=1&a=2&a=5&b=7');
    });

    it('should skip null values', function () {
        expect(ServiceUtils.constructQueryParameters(
            {
                a: '',
                b: 7,
                c: null,
                d: undefined,
                e: [],
                f: 0
            }))
            .toEqual('?b=7&f=0');
    });

    it('should encode URL parameters', function () {
        expect(ServiceUtils.constructQueryParameters(
            {
                'A B': 'C',
                'C': 'D E'
            })).toBe('?A%20B=C&C=D%20E');
    });

    it('should encode objects as JSON', function () {
        expect(ServiceUtils.constructQueryParameters({
            person: {
                name: 'Pesho',
                age: 12
            }
        })).toEqual('?person=%7B%22name%22%3A%22Pesho%22%2C%22age%22%3A12%7D');
    });

    it('should encode objects as JSON when they are in arrays', function () {
        expect(ServiceUtils.constructQueryParameters({
            person: [
                {
                    name: 'Pesho',
                    age: 12
                },
                {
                    name: 'Gosho', age: 13
                }]
        })).toEqual('?person=%7B%22name%22%3A%22Pesho%22%2C%22age%22%3A12%7D&person=%7B%22name%22%3A%22Gosho%22%2C%22age%22%3A13%7D');
    });

    it('should construct service URLs', function () {
        expect(ServiceUtils.constructServiceUrl('foo', 'bar'))
            .toEqual(INTELLOGO_API_LOCATION + '/api/foo/bar');
        expect(ServiceUtils.constructServiceUrl('foo', 'bar', '?boo=true'))
            .toEqual(INTELLOGO_API_LOCATION + '/api/foo/bar?boo=true');
        expect(ServiceUtils.constructServiceUrl('foo'))
            .toEqual(INTELLOGO_API_LOCATION + '/api/foo');
    });

    it('should construct service URLs by path', function () {
        expect(ServiceUtils.constructServiceUrlByPath('foo/bar'))
            .toEqual(INTELLOGO_API_LOCATION + '/api/foo/bar');
        expect(ServiceUtils.constructServiceUrlByPath('/foo/bar'))
            .toEqual(INTELLOGO_API_LOCATION + '/api/foo/bar');
        expect(ServiceUtils.constructServiceUrlByPath('foo'))
            .toEqual(INTELLOGO_API_LOCATION + '/api/foo');
    });
});
