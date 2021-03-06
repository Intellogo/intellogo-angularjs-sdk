## AuthService  
initializeRefresh  
isLoggedIn  
loginWithPassword  
loginWithClientCredentials  
logout  
refresh  
setClientCredentials  

## CaptionsService  
deleteChannel  
getAllChannels  
  
## CategoryService  
addNewCategories  
associateContentsWithCategory  
deAssociateContentsWithCategory  
getAllCategories  
getCategoriesMetadata  
getCategoryImages  
getCategoriesCount  
getCategoriesRestrictions  
getDynamicCategories  
expandContentsInCategory  
removeCategories  
saveCategoryChanges  
saveCategoryDataChanges  
invalidateCategories  
  
## ClientService  
delete  
get  
me  
save  
query  
  
## ContentGroupsService  
delete  
get  
save  
query  
  
## ContentService  
getAllContentSources  
getAllContentsInCategories  
getAllTopLevelContents  
getContentDescendants  
getContentsByIds  
getContentsBySourceId  
getContentsCount  
getIngestedContentBySources  
getBlacklistedContentBySources  
getContentsRestrictions  
getEpubImportEndpoint  
getImportArticlesEndpoint  
getStatusWithPayload  
getFullTaskStatus  
importArticles  
importCaptions  
removeContentTree  
removeContents  
updateContentTreeMetadata  
updateContentUsers  
   
## EndpointService  
delete  
get  
save  
query  
  
## FeedSourcesService  
addSource  
collectFeeds  
getSources  
removeSource  
updateSource  
  
## LiveConfigService  
getConfig  
restoreDefaults  
saveConfig  
  
## RatingService  
countRatingsForSmartFolder  
countIndividualRatingsForSmartFolder  
getCategoryRatingsForContent  
getCategoryRatingMapForContents  
getContentRatingsForContent  
getContentRatingsForContentInitiateTraining  
getContentRatingsInCategories  
getRatings  
getRatingsAsCSV  
getRatingsForSmartFolder  
getRatingsForSmartFolderCSV  
removeContentRatingsForContent  
removeAllContentToContentRatings  
removeRatings  
  
## ReadingProfilesService  
analyzeProfile  
categoryCombinations  
getProfileContentsCount  
loadProfileContents  
loadProfiles  
removeProfiles  
saveProfile  
  
## SmartFoldersService  
addSmartFolder  
deleteSmartFolder  
getAllSmartFolders  
getSmartFolderImage  
updateSmartFolders  
  
## SystemTasksService  
getSystemTaskTypes  
initiateSystemTask  
  
## TrainingService  
cancelTask  
getStatus  
getTaskStatusById  
initiateTraining  
  
## UsersService  
getUsersByIds  
getUsersByUsername  
  
## VersionService  
getVersion  
  
## IntellogoSourceLink  
Intellogo includes content from various sources. Each content the API returns carries metadata, but sometimes this metadata does not contain a working URL to the actual source of the content (Wikipedia, Project Gutenberg, news sites, etc.). The `intellogoSourceLink` `filter` converts a content to its original source URL.  