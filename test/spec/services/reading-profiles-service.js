'use strict';

describe('Service: ReadingProfilesService', function () {

  // load the service's module
  beforeEach(module('intellogoSDK'));

  // instantiate service
  var ReadingProfilesService, RatingService, http, CategoryService;
  beforeEach(inject(function (_CategoryService_, _RatingService_,
                              _ReadingProfilesService_, $http) {
    ReadingProfilesService = _ReadingProfilesService_;
    RatingService = _RatingService_;
      CategoryService = _CategoryService_;
    http = $http;

      spyOn(CategoryService, 'saveCategoryDataChanges')
          .and.callFake(function(categories, origData, callback) {
             callback(null, [{categoryId: 'cat1'}]);
          });
  }));

    it('should get all profiles', function () {
        spyOn(http, 'get');

        ReadingProfilesService.loadProfiles();

        expect(http.get).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/profiles/all'));
    });

    it('should save new profiles', function () {
        var newProfile = {
            clientReference: 'foo',
            contents : [ {contentId : '1'} ],
            originalContents : []
            }, changeCall = {
                    clientReference: 'foo',
                    contents  : []
            };
        spyOn(http, 'post').and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

        ReadingProfilesService.saveProfile(newProfile, function () {});

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/profiles/add'),
            [changeCall]);
    });

    it('should update existing profiles only if changed', function () {
        var changedContentsProfile = {
            _id: 'id1',
            clientReference: 'foo',
            contents: [{contentId: '1'}],
            categoryId: 'cat2',
            originalContents: ['2'],
            originalClientRef: 'foo'
        }, changeCall = {
            profileId: 'id1',
            profileData: {
                clientReference: 'foo',
                contentIdsToUnassign: [],
                contentIdsToAssign: []
            }
        };
        spyOn(http, 'post').and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

        ReadingProfilesService.saveProfile(changedContentsProfile,
            function () {
            });

        //expect(http.post).toHaveBeenCalledWith(
        //    window.ApiEndpointHelper.getEndpoint(
        //        '/profiles/update'),
        //    changeCall);

        var changedClientRefProfile = {
            _id: 'id1',
            clientReference: 'foo',
            contents: [{contentId: '1'}],
            categoryId: 'cat1',
            originalContents: ['1'],
            originalClientRef: 'oo'
        };

        ReadingProfilesService.saveProfile(changedClientRefProfile,
            function () {});

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint(
                '/profiles/update'),
                changeCall);
    });

    it('should remove existing profiles properly', function () {
        var profile = {
            _id      : 'id1',
            clientReference: 'foo',
            contents : [ {contentId : '1'} ]
        };
        spyOn(http, 'post').and.returnValue(window.HttpMockHelper.mockHttpPromise({}));

        ReadingProfilesService.removeProfiles(profile);

        expect(http.post).toHaveBeenCalledWith(
            window.ApiEndpointHelper.getEndpoint('/profiles/remove'),
            [profile]);
    });

    it('should analyze profiles properly', function () {
        var profile = {
            _id      : 'id1',
            clientReference: 'foo',
            contents : [ {contentId : '1'} ]
        }, minScore = 0.7;
        spyOn(http, 'post').and
            .returnValue(window.HttpMockHelper.mockHttpPromise([]));
        ReadingProfilesService.analyzeProfile(profile, minScore, false);

        expect(http.post)
            .toHaveBeenCalledWith(
                window.ApiEndpointHelper.getEndpoint('/rating/contentsCategoryRatingsMap'),
                {
                    profileId: 'id1',
                    productionReady: false,
                    minScore: minScore
                });
    });

    it('should return category combinations', function () {
        var profile = {
            _id: 'id1',
            clientReference: 'foo',
            contents: [{contentId: '1'}]
        }, combinationsParams = {
                    minScore: 0.7,
                    combinationCategoriesMin: 2,
                    combinationCategoriesMax: 5,
                    combinationContentsMinPercent: 0.05,
                    limit: 10000
        },
        expectedCallParams = _.clone(combinationsParams);
        expectedCallParams.profileId = 'id1';
        spyOn(http, 'post').and
            .returnValue(window.HttpMockHelper.mockHttpPromise([]));
        ReadingProfilesService.categoryCombinations(profile, combinationsParams);

        expect(http.post)
            .toHaveBeenCalledWith(
                window.ApiEndpointHelper.getEndpoint(
                    '/profiles/categoryCombinations'),
                expectedCallParams);
    });
});
