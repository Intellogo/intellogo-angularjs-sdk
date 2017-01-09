'use strict';

describe('Filter: intellogoSourceLink', function () {

    // load the filter's module
    beforeEach(module('intellogoSDK'));

    // initialize a new instance of the filter before each test
    var sourceLinkFilter;
    beforeEach(inject(function ($filter) {
        sourceLinkFilter = $filter('intellogoSourceLink');
    }));

    it('should construct Wikipedia URLs', function () {
        var content = {
            metadata: {
                source: 'Wikipedia',
                sourceId: 191
            }
        };

        expect(sourceLinkFilter(content))
            .toBe('https://en.wikipedia.org/?curid=191');
    });

    it('should construct Gutenberg URLs', function () {
        var content = {
            metadata: {
                source: 'Project Gutenberg',
                sourceId: 1337
            }
        };

        expect(sourceLinkFilter(content))
            .toBe('https://www.gutenberg.org/ebooks/1337');
    });

    it('should return empty URLs for malformed contents', function () {
        expect(sourceLinkFilter({})).toBe('');
        expect(sourceLinkFilter(
            {
                metadata: {}
            }))
            .toBe('');
        expect(sourceLinkFilter(
            {
                metadata: {
                    source: 'invalidSource'
                }
            }))
            .toBe('');
    });

    it('should use the source ID if the source is "unknown" and the source ' +
       'ID looks like an URL', function () {
        expect(sourceLinkFilter({
            metadata: {
                source: 'Engadget',
                sourceId: 'http://www.engadget.com/2015/04/21/projector-tiny-living-room/?ncid=rss_truncated'
            }
        })).toBe('http://www.engadget.com/2015/04/21/projector-tiny-living-room/?ncid=rss_truncated');
        expect(sourceLinkFilter({
            metadata: {
                source: 'Engadget',
                sourceId: 'https://www.engadget.com/2015/04/21/projector-tiny-living-room/?ncid=rss_truncated'
            }
        })).toBe('https://www.engadget.com/2015/04/21/projector-tiny-living-room/?ncid=rss_truncated');
        expect(sourceLinkFilter({
            metadata: {
                source: 'Engadget',
                sourceId: 'imnotanURL'
            }
        })).toBe('');
    });
});
