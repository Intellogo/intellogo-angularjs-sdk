'use strict';

/**
 * @ngdoc service
 * @name rest.ServiceUtils
 * @description
 * # ServiceUtils
 * Factory in the rest.
 */
angular.module('rest').factory(
    'ServiceUtils', function (INTELLOGO_API_LOCATION) {
        function processArray(key, parameters) {
            return _.chain(parameters)
                .map(function (value, idx) {
                         var result;
                         if (_.isObject(value)) {
                             result = processObject(key, value);
                         } else {
                             result = processSimpleKeyValue(key, value);
                         }
                         return (idx === 0 ? '' : '&') + result;
                     })
                .reduce(function (result, params) {
                            return result + params;
                        })
                .value();
        }

        function processObject(key, object) {
            return encodeURIComponent(key) + '=' +
                encodeURIComponent(JSON.stringify(object));
        }

        function processSimpleKeyValue(key, value) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(value);
        }

        function processParameter(key, value, first) {
            var result;

            if (_.isArray(value)) {
                result = processArray(key, value);
            } else if (_.isObject(value)) {
                result = processObject(key, value);
            } else {
                result = processSimpleKeyValue(key, value);
            }

            return (first ? '?' : '&') + result;
        }

        function constructQueryParameters(queryParams) {
            return _.chain(queryParams)
                .pairs()
                .filter(function (pair) {
                            var value = pair[1],
                                isNonNull = (value === 0 || !!value),
                                isEmptyArray = _.isArray(value) &&
                                    !value.length;
                            return isNonNull && !isEmptyArray;
                        })
                .map(function (pair, idx) {
                         return processParameter.call(this,
                                                      pair[0],
                                                      pair[1],
                                                      idx === 0);
                     })
                .reduce(function (result, params) {
                            return result + params;
                        }, '')
                .value();
        }

        /**
         * Constructs an URL to a rest service by the path to the service.
         *
         * Use "constructServiceUrl" instead of this method, if possible.
         * @param {string} path The path (e.g. "/contents/sources").
         * @return {string} The result (e.g.
         * "http://api-location.com/api/contents/sources").
         */
        function constructServiceByPath(path) {
            var apiLocation = INTELLOGO_API_LOCATION,
                location = apiLocation[apiLocation.length - 1] === '/' ?
                    apiLocation : apiLocation + '/',
                actualPath = path[0] === '/' ? path.slice(1) : path;
            return location + 'api/' + actualPath;
        }

        /**
         * Constructs a service URL by a group and service names.
         * @param {string} group The group (e.g. "contents")
         * @param {string} [service] The service (e.g. "sources")
         * @param {string} [additionalParams] Additional parameters that will be
         * appended to the URL without any delimiters.
         * @return {string} The result (e.g.
         * "http://api-location.com/api/contents/sources").
         */
        function constructServiceUrl(group, service, additionalParams) {
            var path;
            if (service) {
                path = group + '/' + service;
            } else {
                path = group;
            }
            return constructServiceByPath(path) + (additionalParams || '');
        }

        return {
            constructQueryParameters: constructQueryParameters,
            constructServiceUrlByPath: constructServiceByPath,
            constructServiceUrl: constructServiceUrl
        };
    });
