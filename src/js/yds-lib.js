var app = angular.module('yds', ['ui.bootstrap', 'rzModule', 'ui.checkbox', 'oc.lazyLoad']);

var host="http://ydsdev.iit.demokritos.gr:8085";
var searchUrl = host+"/YDSAPI/yds/api/search";
var visualizationUrl = host+"/YDSAPI/yds/api/couch/visualization/";
var espaProjectURL = host+"/YDSAPI/yds/api/couch/espa/";
var geoRouteUrl = host+"/YDSAPI/yds/geo/route";
var embedUrl = host+"/YDSAPI/yds/embed/";


// Defining global variables for the YDS lib
app.constant("YDS_CONSTANTS", {
    /*"SEARCH_RESULTS_URL": "http://yds-lib.dev/#/search",*/
    "SEARCH_RESULTS_URL": "http://ydsdev.iit.demokritos.gr/YDSComponents/#/search",
    "PROJECT_DETAILS_URL": "http://ydsdev.iit.demokritos.gr/yds/content/project-details"
});

app.directive('clipboard', [ '$document', function(){
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function(e){
                var iframeURL = angular.element(element.parent()[0].getElementsByClassName("well"));

                var range = document.createRange();         // create a Range object
                range.selectNode(iframeURL[0]);             // set the Node to select the "range"

                var selection = document.getSelection();
                selection.addRange(range);                  // add the Range to the set of window selections

                document.execCommand('copy');               // execute 'copy', can't 'cut' in this case
                selection.removeAllRanges();                // clear the selection
            });
        }
    }
}]);

app.run(function($rootScope, $location){
    //Bind the `$locationChangeSuccess` event on the rootScope, so that we dont need to bind in induvidual controllers.
    $rootScope.$on('$locationChangeStart', function() {
        $rootScope.actualLocation = $location.path();
    });
});


app.factory('Data', ['$http', '$q', function ($http, $q) {
    var backButtonUsed = false;

    var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
        angular.forEach(observerStack, function (callback) {
            callback();
        });
    };

    return {
        isBackButtonUsed: function() { return backButtonUsed; },
        backButtonUsed : function () { backButtonUsed = true; },
        backButtonNotUsed : function () { backButtonUsed = false; },
        projectVisualization: function (projectId,visualizationType) {
            //param search_obj = {}
            var deferred = $q.defer();

            //call the service with POST method
            $http({
                method: 'POST',
                url: visualizationUrl,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    project_id: projectId,
                    viz_type: visualizationType
                }
            })
            .success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getRoutePoints: function(start, end, via) {
            var deferred = $q.defer();

            var inputData = {
                startPoint: start,
                endPoint: end,
                viaPoints: via
            };
            $http({
                method: 'POST',
                url: geoRouteUrl,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: { geoData: angular.toJson(inputData) }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        saveGeoObj: function(projectId,geoObj) {
            var deferred = $q.defer();

            $http({
                method: 'POST',
                url: geoRouteUrl+"/save/"+projectId,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    geoData: angular.toJson(geoObj)
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getGeoObj: function(projectId) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: geoRouteUrl+"/"+ projectId,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        requestEmbedCode: function(projectId, facets, visType) {
            var deferred = $q.defer();

            $http({
                method: 'POST',
                url: embedUrl + "save",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    "project_id": projectId,
                    "facets": JSON.stringify(facets),
                    "viz_type": visType
                }
            })
            .success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        recoverEmbedCode: function(embedCode) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: embedUrl + embedCode
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getVisualizationData: function(projectId, tableType) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: espaProjectURL + projectId + "/" + tableType,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getBreadcrumbColor: function (index) {
            var colors = [
                "#0000ff", "#a52a2a", "#a020f0", "#ff0000", "#ffc0cd",
                "#ffa500", "#00ff00", "#ffff00", "#C0C000", "#C0C0FF",
                "#C0C0C0", "#800000", "#008000", "#000080", "#808000",
                "#800080", "#008080", "#808080", "#C00000", "#00C000",
                "#0000C0", "#C0C000", "#C000C0", "#00C0C0", "#C0C0C0",
                "#C0DCC0", "#A6CAF0", "#006669", "#FFFF99", "#A0A0A4",
                "#FFCC66", "#CC6600", "#996600", "#66CC3C", "#006699",
                "#FF9900", "#a52a2a", "#0000ff", "#40e0d0", "#5f9ea0",
                "#ff7f50", "#bdb76b", "#ff0000", "#7cfc00", "#f0fff0",
                "#808080", "#ffa500", "#191970", "#d8bfd8", "#adff2f",
                "#000000", "#00bfff", "#696969", "#ff8c00", "#f8f8ff",
                "#4169e1", "#c71585", "#d3d3d3", "#800080", "#ffdead",
                "#fa8072", "#48d1cc", "#4b0082", "#d2b48c", "#00ffff"
            ];

            return colors[index];
        }, getBrowseData: function () {
            var deferred = $q.defer();
            var serverURL = "http://ydsdev.iit.demokritos.gr/YDSComponents/data/browse_pilot1_new.json";
            //serverURL = "../data/browse_pilot1_new.json";

            $http({
                method: 'GET',
                url: serverURL,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }, createRandomId : function () {
            return '_' + Math.random().toString(36).substr(2, 9);
        }
    }
}]);

/**************************************************/
/********* NEW VERSION OF SEARCH SERVICE **********/
/**************************************************/
app.factory('Search', ['$http', '$q', function ($http, $q) {
    var keyword = "";
    var searchResults = [];

    var createNewTerm = function (keyword) {	//return a new term object
        return {			//term object
            term: keyword,
            facets: []
        };
    };

    var createNewFacet = function (type, value) {	//return a new facet object
        return {
            facet_type: type,
            facet_value: [value]
        }
    };

    return {
        initialiseSearchObj: function () {		//initialise the search object
            searchObj = {
                advanced: false,
                terms: [],
                relations: []
            };
        },
        setKeyword: function(newKeyword) { keyword = angular.copy(newKeyword); },
        getKeyword: function() { return keyword; },
        clearKeyword: function() { keyword = ""; },
        performSearch: function (newKeyword) {
            var deferred = $q.defer();
            var proxyUrl = "localhost:9292/";
             proxyUrl = "";
            var baseUrl = "ydsdev.iit.demokritos.gr/api/mudcat/public-projects";

            $http({
                method: 'GET',
                url: "http://" + proxyUrl + baseUrl + "?filter=" + newKeyword,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data) {
                searchResults = angular.copy(data);
                deferred.resolve(searchResults);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getResults: function () { return searchResults; },
        clearResults: function () { searchResults = []; },
        updateFacet: function (ftype, fvalue) {
            var tmpTerm = searchObj.terms[0];

            var facetObjIndex = _.findIndex(tmpTerm.facets, {facet_type: ftype});		//find if the facet exists and get its index
            var facetObj = tmpTerm.facets[facetObjIndex];

            if (angular.isUndefined(facetObj)) {		//if facet_type doesn't exist, add new facet obj
                var newFacet = createNewFacet(ftype, fvalue);
                tmpTerm.facets.push(newFacet);
            } else {
                var facetValueIndex = _.indexOf(facetObj.facet_value, fvalue);		//search the index of the fvalue, if exists;

                if (facetValueIndex > -1) {		//if the value exists remove it
                    facetObj.facet_value.splice(facetValueIndex, 1);

                    if (facetObj.facet_value.length == 0) {		//if the facet_value list is empty, remove the entire facet
                        tmpTerm.facets.splice(facetObjIndex, 1);
                    }
                } else { 						//if the value doesn't exist, add it
                    facetObj.facet_value.push(fvalue);
                }
            }
        }
    }
}]);
