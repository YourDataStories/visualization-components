angular.module("yds").directive("ydsClearFiltersButton", ["DashboardService",
    function (DashboardService) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/clear-filters-button.html",
            link: function (scope) {
                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length == 0) {
                    scope.lang = "en";
                }

                // Make the button disabled if the given dashboardId is not set up in DashboardService
                scope.disableBtn = !DashboardService.dashboardIdHasCookies(scope.dashboardId);

                /**
                 * Clear the filters for the specified Dashboard
                 */
                scope.clearFilters = function () {
                    DashboardService.clearDashboardCookies(scope.dashboardId);
                }
            }
        };
    }
]);