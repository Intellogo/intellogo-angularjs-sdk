'use strict';

/**
 * @ngdoc service
 * @name rest.localStorageBackedVariable
 * @description
 * # localStorageBackedVariable
 * Service in the rest.
 */
angular.module('intellogoSDK').factory(
    'LocalStorageBackedVariable',
    function () {
        function createTesting() {
            var _value;
            return {
                getValue: function () {
                    return _value;
                },
                setValue: function (value) {
                    _value = value;
                }
            };
        }

        function stringifyValue(value) {
            if (value !== undefined) {
                return JSON.stringify(value);
            }
            return '';
        }

        function parseValue(value) {
            if (value && value !== '') {
                var result;
                try {
                   result = JSON.parse(value);
                } catch (e) {
                    // the old value is not valid JSON and probably
                    // was generated before adding the parse
                    result = value;
                }
                return result;
            }
            return undefined;
        }

        function create(name) {
            var _value = localStorage.getItem(name);
            _value = parseValue(_value);
            return {
                getValue: function () {
                    return _value;
                },
                setValue: function (value) {
                    var strValue = stringifyValue(value);
                    if (stringifyValue(_value) !== strValue) {
                        localStorage.setItem(name, strValue);
                    }
                    _value = value;
                }
            };
        }

        function isInTestingMode() {
            return window.hasOwnProperty('TEST_MODE') && window.TEST_MODE;
        }

        return {
            createHolder: function () {
                if (isInTestingMode()) {
                    return createTesting.apply(this, arguments);
                } else {
                    return create.apply(this, arguments);
                }
            }
        };
    });
