'use strict';

describe('Service: FileDownloadDialogService', function () {

    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var FileDownloadDialogService,
        UtlUtils,
        windowService;
    beforeEach(inject(function ($window,
                                _FileDownloadDialogService_,
                                _UrlUtils_) {
        FileDownloadDialogService = _FileDownloadDialogService_;
        windowService = $window;
        UtlUtils = _UrlUtils_;
    }));

    it('initiate download of files in a new window', function () {
        spyOn(UtlUtils, 'addAccessTokenToUrl').and.returnValue('newurl');
        spyOn(windowService, 'open');

        FileDownloadDialogService.downloadFileInNewWindow('url');
        expect(UtlUtils.addAccessTokenToUrl).toHaveBeenCalledWith('url');
        expect(windowService.open).toHaveBeenCalledWith('newurl');
    });
});
