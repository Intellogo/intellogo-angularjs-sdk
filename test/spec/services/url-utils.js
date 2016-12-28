'use strict';

describe('Service: urlUtils', function () {

    // load the service's module
    beforeEach(module('rest'));

    // instantiate service
    var UrlUtils;
    beforeEach(inject(function (_UrlUtils_) {
        UrlUtils = _UrlUtils_;
    }));

    it('should do something', function () {
        expect(!!UrlUtils).toBe(true);
    });

});
