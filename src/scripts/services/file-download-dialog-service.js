'use strict';

/**
 * @ngdoc service
 * @name rest.fileDownloadDialogService
 * @description
 * # fileDownloadDialogService
 * Service in the rest.
 */
angular.module('intellogoSDK').service(
    'FileDownloadDialogService',
    function (UrlUtils, $window) {
        function downloadFileInNewWindow(url) {
            $window.open(UrlUtils.addAccessTokenToUrl(url));
        }

        return {
            downloadFileInNewWindow: downloadFileInNewWindow
        };
    });
