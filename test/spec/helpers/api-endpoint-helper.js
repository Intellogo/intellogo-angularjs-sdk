'use strict';

/**
 * Helper for API endpoint URL manipulation.
 *
 * @type {{getEndpoint: Function, getOauthEndpoint: Function}}
 */
window.ApiEndpointHelper = {
    /**
     * Gets an API endpoint as a URL.
     * @param endpoint The target endpoint (e.g. '/categories/assign')
     * @returns {string}
     */
    getEndpoint: function (endpoint) {
        var _API_LOCATION = '<API_LOCATION is not properly injected!>';
        inject(function (API_LOCATION) {
            _API_LOCATION = API_LOCATION;
        });
        return _API_LOCATION + '/api' + endpoint;
    },
    /**
     * Gets a raw endpoint as a URL.
     * @param endpoint The target endpoint (e.g. '/version')
     * @returns {string}
     */
    getRawEndpoint: function (endpoint) {
        var _API_LOCATION = '<API_LOCATION is not properly injected!>';
        inject(function (API_LOCATION) {
            _API_LOCATION = API_LOCATION;
        });
        return _API_LOCATION + endpoint;
    },
    /**
     * Gets an OAuth endpoint as a URL.
     * @param endpoint The target endpoint (e.g. '/token')
     * @returns {string}
     */
    getOauthEndpoint: function (endpoint) {
        var _API_LOCATION = '<API_LOCATION is not properly injected!>';
        inject(function (API_LOCATION) {
            _API_LOCATION = API_LOCATION;
        });
        return _API_LOCATION + '/oauth' + endpoint;
    }
};
