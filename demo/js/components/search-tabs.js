angular.module('yds').directive('ydsSearchTabs', ['Data', 'Search', '$location', 'Translations',
    function(Data, Search, $location, Translations){
        return {
            restrict: 'E',
            scope: {
                defaultTab: '@',        // Default tab to select when page loads
                urlParamPrefix: '@',    // Prefix to add before all url parameters (optional)
                hideTabs: '@',          // If true, tabs will be hidden and only the default tab will show
                lang : '@'              // Language of component
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' :'') + 'templates/search-tabs.html',
            link: function(scope) {
                scope.initialized = false;	    // flag that indicated when the component is initialized
                scope.tabs = {};                // Object with tab information
                scope.translations = Translations.getAll(scope.lang);   // Translations used for no results message

                var defaultTab = scope.defaultTab;
                var paramPrefix = scope.urlParamPrefix;

                var prevQ = "";                 // Keeps previous search query value
                var prevRules = "";             // Keeps previous advanced search rules
                var prevTab = "";               // Keeps previous tab name value

                // check if the language attr is defined, else assign default value
                if(_.isUndefined(scope.lang) || scope.lang.trim()=="")
                    scope.lang = "en";

                // if no url parameter prefix is defined or it is only whitespace, use not parameter prefix
                if (_.isUndefined(paramPrefix) || (paramPrefix.trim()=="" && paramPrefix.length > 0)) {
                    paramPrefix = "";
                    scope.urlParamPrefix = "";
                }

                /**
                 * Initializes the tabs and makes the first one active
                 */
                var initTabs = function() {
                    Search.getSearchTabs(scope.lang).then(function(response) {
                        // Get tabs from the response
                        var tabs = response.tabs;

                        // Set all the tabs to inactive so the first one isn't activated by default
                        _.each(tabs, function(tab) {
                            tab.active = (tab.concept == defaultTab);
                        });

                        // Set the tabs variable
                        scope.tabs = tabs;

                        scope.initialized = true;
                    });
                };

                /**
                 * Changes the url parameters to reflect tab changes
                 * @param tabName
                 */
                scope.tabChangeHandler = function (tabName) {
                    // Change the url parameter to reflect the tab change
                    $location.search(paramPrefix + "tab", tabName);
                };

                /**
                 * Runs when the url parameters change and acts depending on which one changed
                 */
                var urlChangeHandler = function() {
                    // Get url parameters to see if the tab or the query/rules changed
                    var urlParams = $location.search();

                    if (urlParams[paramPrefix + "q"] != prevQ || urlParams[paramPrefix + "rules"] != prevRules) {
                        // The query or rules changed, need to update tab result counts
                        prevQ = urlParams[paramPrefix + "q"];
                        prevRules = urlParams[paramPrefix + "rules"];
                        prevTab = urlParams[paramPrefix + "tab"];

                        // Get the search term from url params and set it as search keyword
                        var keyword = urlParams[paramPrefix + "q"];
                        Search.setKeyword(keyword);

                        // Get the advanced search rules from url params to use for getting tab result counts
                        var rules = urlParams[paramPrefix + "rules"];
                        if (!_.isUndefined(rules)) {
                            rules = JSURL.parse(rules);
                        }

                        // Initialize tabs if needed
                        if (!scope.initialized) {
                            initTabs();
                        }

                        // Update result counts of tabs
                        Search.getTabResultCounts(rules).then(function(tabResultCounts) {
                            // Update amounts of tabs
                            _.each(scope.tabs, function(tab) {
                                if (_.has(tabResultCounts, tab.concept)) {
                                    // update the tab's amount to the new one
                                    tab.amount = tabResultCounts[tab.concept];
                                } else {
                                    // set tab's amount to 0
                                    tab.amount = 0;
                                }
                            });

                            // Make the correct tab selected
                            var prevSelTab = $location.search()[paramPrefix + "tab"];

                            if (!_.isUndefined(prevSelTab)) {
                                // Find and select the previously selected tab
                                _.each(scope.tabs, function(tab) {
                                    if (tab.concept == prevSelTab) {
                                        tab.active = true;
                                    }
                                });
                            } else {
                                // Select first tab
                                var tabToSel = _.first(scope.tabs);
                                tabToSel.active = true;
                                prevTab = tabToSel.concept;
                            }
                        });
                    } else if (urlParams[paramPrefix + "tab"] != prevTab) {
                        // The tab changed
                        prevTab = urlParams[paramPrefix + "tab"];

                        // Reset the search keyword and remove it from URL parameters
                        Search.clearKeyword();
                        $location.search(paramPrefix + "q", null);

                        // Remove query builder rules from URL parameters (if there are any)
                        $location.search(paramPrefix + "rules", null);
                    }
                };

                var pageLoadHandler = function () {
                    if (!scope.initialized) {
                        urlChangeHandler();     // call url change handler to initialize the page
                        pageLoadListener();     // remove event listener
                    }
                };

                var pageLoadListener = scope.$watch(function () { return $location.search() }, pageLoadHandler);
                scope.$on("$locationChangeSuccess", urlChangeHandler);
            }
        };
    }
]);