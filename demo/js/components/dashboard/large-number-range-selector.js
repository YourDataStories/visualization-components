angular.module("yds").directive("ydsLargeNumberRange", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                minValue: "@",      // Minimum year of the slider (for year selection)
                maxValue: "@",      // Maximum year of the slider (for year selection)
                defaultValue: "@",  // Default value
                selectionType: "@", // Selection type for DashboardService
                title: "@"          // Title to show above slider (optional)
            },
            templateUrl: Data.templatePath + "templates/dashboard/large-number-range-selector.html",
            link: function (scope, element, attrs) {
                var selectizeDiv = _.first(angular.element(element[0].querySelector(".large-number-range-select")));

                // noinspection UnnecessaryLocalVariableJS
                var elementId = "lnrs" + Data.createRandomId();
                selectizeDiv.id = elementId;

                var minValue = parseInt(scope.minValue);
                var maxValue = parseInt(scope.maxValue);
                var defaultValue = scope.defaultValue;
                var selectionType = scope.selectionType;

                // Check if minValue attribute is defined, else assign default value
                if (_.isUndefined(minValue) || _.isNaN(minValue))
                    minValue = 0;

                // Check if maxValue attribute is defined, else assign default value
                if (_.isUndefined(maxValue) || _.isNaN(maxValue))
                    maxValue = 100;

                // todo: Generate this array from min/max values, e.g. https://stackoverflow.com/a/846249
                var selectValues = [0, 1, 10, 100, 1000];

                /**
                 * Save the current value of the slider to the DashboardService
                 */
                var saveValueToDashboardService = function () {
                    DashboardService.saveObject(selectionType, scope.slider.value);
                };

                // Check if there is a saved selection in the cookies, and use that as default
                var cookieValue = DashboardService.getCookieObject(selectionType);
                if (!_.isUndefined(cookieValue) && !_.isNull(cookieValue)) {
                    defaultValue = cookieValue;
                }

                // Save initial slider value to DashboardService
                // saveValueToDashboardService();

                // Initialize Selectize.js
                $(selectizeDiv).selectize({
                    options: _.map(selectValues, function (item) {
                        return {
                            value: item,
                            text: item
                        };
                    }),
                    create: true,
                    createOnBlur: true,
                    maxItems: 1,
                    placeholder: "Select " + scope.title
                });
                //todo: When adding items, check if they are numbers and between min/max values (see createFilter)
            }
        };
    }
]);