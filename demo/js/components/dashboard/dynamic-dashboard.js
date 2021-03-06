angular.module("yds").directive("ydsDynamicDashboard", ["$timeout", "$location", "$anchorScroll", "$window", "$sce", "DashboardService", "Data",
    function ($timeout, $location, $anchorScroll, $window, $sce, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                userId: "@",    // User ID
                lang: "@",      // Language of Dashboard
                type: "@"       // Type of Dashboard. If undefined, will show type selection radio buttons.
            },
            templateUrl: Data.templatePath + "templates/dashboard/dynamic-dashboard.html",
            link: function (scope, element, attrs) {
                var defaultDashboard, oldFilters;

                // If there is a "type" in the scope, use that as the default dashboard, or get it from cookies
                if (_.isUndefined(scope.type) || scope.type.trim() === "") {
                    scope.type = "choose";
                    defaultDashboard = DashboardService.getCookieObject("dynamic_dashboard_type") || "aidactivity";
                } else {
                    defaultDashboard = scope.type;
                }

                // Set default language, if not already set
                if (_.isUndefined(scope.lang) || scope.lang.trim() === "")
                    scope.lang = "en";

                // Set configuration of Dashboards
                scope.dashboardsConfig = {
                    types: [{
                        label: "Aid Activity",
                        type: "aidactivity",
                        icon: "fa-medkit",
                        infoUrl: $sce.trustAsHtml(Data.templatePath + "templates-demo/dashboards/dashboard2-info.html"),
                        detailsUrl: $sce.trustAsHtml(Data.templatePath + "templates-demo/pages/view-aid.html"),
                        viewDataDescription: "The following table shows all Aid Activities for the selected " +
                        "benefactor and beneficiary countries that span the selected time period."
                    }, {
                        label: "Trade Activity",
                        type: "tradeactivity",
                        icon: "fa-exchange",
                        infoUrl: $sce.trustAsHtml(Data.templatePath + "templates-demo/dashboards/dashboard2-info.html"),
                        detailsUrl: $sce.trustAsHtml(Data.templatePath + "templates-demo/pages/view-trade.html"),
                        viewDataDescription: "The following table shows all Trade Activities for the selected " +
                        "origin and destination countries that span the selected time period."
                    }, {
                        label: "Contract",
                        type: "contract",
                        icon: "fa-pencil",
                        infoUrl: null,
                        detailsUrl: $sce.trustAsHtml(Data.templatePath + "templates-demo/pages/view-contract.html"),
                        viewDataDescription: "The following table shows all Contracts for the selected " +
                        "seller and buyer countries that span the selected time period."
                    }, {
                        label: "Sellers",
                        type: "company",
                        icon: "fa-credit-card",
                        infoUrl: null,
                        detailsUrl: $sce.trustAsHtml(Data.templatePath + "templates-demo/pages/view-seller.html"),
                        viewDataDescription: "The following table shows all Sellers for the selected " +
                        "contracts that span the selected time period."
                    }],
                    selectedDashboard: defaultDashboard,
                    viewDataDescription: "",
                    filters: []
                };

                // Column width classes for each filter type
                scope.filterColumnClass = {
                    "grid": "col-md-6",
                    "grid-grouped": "col-md-12",
                    "heatmap": "col-md-6",
                    "amount": "col-md-6",
                    "year": "col-md-6",
                    "number-range": "col-md-6"
                };

                scope.showProjectInfo = false;
                scope.aggregateToShow = 0;
                scope.aggregateClasses = [];
                scope.aggregateValues = {};

                /**
                 * Update the selected filters array to include only the filters which are selected in the filters checkbox list
                 */
                scope.updateSelectedFilters = function (forceFilters) {
                    var selectedFilters;
                    if (_.isUndefined(forceFilters) || _.isEmpty(forceFilters)) {
                        // Get filters where the checked property is true
                        selectedFilters = _.chain(scope.dashboardsConfig.filters)
                            .where({checked: true})
                            .pluck("name")
                            .value();
                    } else {
                        // Use the given filters as selected
                        selectedFilters = forceFilters;

                        // Make selected filters be checked, and all others unchecked
                        _.each(scope.dashboardsConfig.filters, function (filter) {
                            filter.checked = _.contains(selectedFilters, filter.name);
                        });
                    }

                    // Save the selected filters to the DashboardService (since the names of the filters are unique
                    // per dashboard, we use them as IDs)
                    DashboardService.saveObject("filter_" + scope.dashboardsConfig.selectedDashboard, selectedFilters);
                };

                /**
                 * Change the Dashboard type.
                 * @param newType
                 */
                scope.changeDashboardType = function (newType) {
                    // Save new Dashboard type to cookies
                    DashboardService.setCookieObject("dynamic_dashboard_type", newType);

                    // Get new available filters
                    scope.dashboardsConfig.filters = DashboardService.getDashboardFilters(newType);

                    // Check there are any saved filters for the new Dashboard type
                    oldFilters = DashboardService
                        .getCookieObject("filter_" + scope.dashboardsConfig.selectedDashboard);

                    // Update selected filters
                    scope.updateSelectedFilters(oldFilters);

                    // Empty the aggregates arrays & details URL to put new items
                    scope.aggregates = [];
                    scope.aggregateTitles = [];
                    scope.aggregateClasses = [];

                    scope.showProjectInfo = false;
                    scope.detailsUrl = "";

                    // Find configuration for the new Dashboard
                    var newDashboardConfig = _.findWhere(scope.dashboardsConfig.types, {
                        type: newType
                    });

                    $timeout(function () {
                        // Update scope variables with URL for the current concept details and short description
                        scope.detailsUrl = newDashboardConfig.detailsUrl;
                        scope.infoPopoverUrl = newDashboardConfig.infoUrl;
                        scope.dashboardsConfig.viewDataDescription = newDashboardConfig.viewDataDescription;

                        var aggregates = DashboardService.getAggregates(newType);
                        scope.aggregateClass = "col-md-" + aggregates.width;

                        // Set classes for tabs
                        scope.aggregateClasses = [];
                        _.each(aggregates.types, function (aggregate) {
                            scope.aggregateClasses.push(aggregate.replace(/\./g, "-"));
                        });

                        // Set new aggregates
                        scope.aggregates = aggregates.types;
                        scope.aggregateTitles = aggregates.titles;
                        scope.selectTab(0);

                        // Need to select the active tab after they have been added with ng-repeat
                        $timeout(function () {
                            scope.dashboardVisActiveTab = 0;
                        });
                    });
                };

                scope.selectTab = function (tabIndex) {
                    scope.aggregateToShow = tabIndex;
                };

                // Select the default Dashboard type
                scope.changeDashboardType(defaultDashboard);

                // Subscribe to be notified of selected project changes
                DashboardService.subscribeProjectChanges(scope, function () {
                    if ($window.pageYOffset < 1000) {
                        // Scroll a bit to make details visible
                        $location.hash("dashboard-data-grid");
                        $anchorScroll();
                    }

                    // Select new project
                    scope.showProjectInfo = false;
                    scope.selectedProject = {};

                    $timeout(function () {
                        scope.selectedProject = DashboardService.getSelectedProjectInfo();
                        scope.showProjectInfo = true;
                    });
                });

                // Subscribe to object changes until we restore filters from cookies
                var unsub = DashboardService.subscribeObjectChanges(scope, function () {
                    var newFilters = DashboardService.getObject("filter_" + scope.dashboardsConfig.selectedDashboard);

                    if (!_.isEqual(newFilters, oldFilters)) {
                        scope.updateSelectedFilters(newFilters);
                        unsub();    // We don't need to be subscribed to object changes anymore
                    }
                });
            }
        };
    }
]);
