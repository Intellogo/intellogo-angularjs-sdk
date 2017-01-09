'use strict';

/**
 * @ngdoc filter
 * @name intellogoSDK.filter:intellogoSourceLink
 * @function
 * @description
 * # sourceLinkFilter
 * When applied to an Intellogo content, returns the appropriate source URL from which
 * the content was imported into the Intellogo system. It may be a Wikipedia URL, a link to
 * a Project Gutenberg book, or a URL to one of the RSS feed sources Intellogo uses.
 */
angular.module('intellogoSDK').filter(
    'intellogoSourceLink',
    function () {
        return function (content) {
            function looksLikeAnUrl(string) {
                if (!_.isString(string)) {
                    return false;
                }
                return string.match(/^https?:\/\//);
            }

            function createUrl(source, sourceId) {
                // jshint maxcomplexity: 6
                var sourceIdLooksLikeAnUrl = looksLikeAnUrl(sourceId);
                if (source === 'Wikipedia') {
                    return 'https://en.wikipedia.org/?curid=' + sourceId;
                } else if (source === 'Project Gutenberg') {
                    return 'https://www.gutenberg.org/ebooks/' + sourceId;
                } else if (source.indexOf('Scribd', 0) === 0 ) {
                    return 'https://www.scribd.com/read/' + sourceId;
                } else if (sourceIdLooksLikeAnUrl) {
                    return sourceId;
                }
                return '';
            }

            var metadata = content.metadata;
            if (!metadata || !metadata.source) {
                return '';
            }

            return createUrl(metadata.source, metadata.sourceId);
        };
    });
