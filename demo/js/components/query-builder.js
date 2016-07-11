angular.module('yds').directive('queryBuilder', ['$compile', '$ocLazyLoad', 'Data', 'Search', 'queryBuilderService',
    function ($compile, $ocLazyLoad, Data, Search, queryBuilderService) {
        return {
            restrict: 'E',
            scope: {
                lang:'@',
                maxSuggestions: '@',
                concept: '@'
            },
            templateUrl: 'templates/query-builder.html',
            link: function (scope) {
                scope.qbInputs = {};		// Keeps the QueryBuilder's typeahead ng models
                scope.randomId = Data.createRandomId();
                scope.builderId = "builder" + scope.randomId;
                scope.noFilters = false;

                // Lazy load jQuery QueryBuilder and add it to the page
                $ocLazyLoad.load({
                    files: [
                        "https://code.jquery.com/jquery-2.2.4.min.js",
                        "css/query-builder.default.min.css",
                        "lib/query-builder.standalone.min.js"
                    ],
                    cache: true,
                    serie: true
                }).then(function () {
                    var builder = $("#" + scope.builderId);

                    // Get filters for query builder
                    Search.getQueryBuilderFilters(scope.concept)
                        .then(function(filters) {
                            // Format filters in the format QueryBuilder expects
                            var formattedFilters = formatFilters(filters);

                            // If there are filters, create builder
                            if (!_.isEmpty(formattedFilters)) {
                                // Create empty builder (no rules)
                                builder.queryBuilder({
                                    filters: formattedFilters
                                });

                                // Watch for all changes in the builder, and update the rules in QueryBuilderService
                                // (https://github.com/mistic100/jQuery-QueryBuilder/issues/195)
                                builder.on("afterDeleteGroup.queryBuilder afterUpdateRuleFilter.queryBuilder " +
                                    "afterAddRule.queryBuilder afterDeleteRule.queryBuilder afterUpdateRuleValue.queryBuilder " +
                                    "afterUpdateRuleOperator.queryBuilder afterUpdateGroupCondition.queryBuilder ", function (e) {
                                    queryBuilderService.setRules(builder.queryBuilder('getRules'));
                                }).on('validationError.queryBuilder', function (e, rule, error, value) {
                                    // Don't display QueryBuilder's validation errors
                                    e.preventDefault();
                                });
                            } else {
                                // Show information box saying there are no filters
                                scope.noFilters = true;
                            }
                        });
                });

                /**
                 * Changes the filters array as returned from the server, to add typeahead in string fields
                 * and get the correct labels depending on the language of the component
                 * @param filters       Filters as returned from the server
                 * @returns {Array}     Formatted filters
                 */
                var formatFilters = function(filters) {
                    var availLangs = Search.geti18nLangs();

                    var newFilters = filters.map(function(obj) {
                        // Find the label the filter should have depending on language
                        var label = obj["label"][scope.lang];
                        if (_.isUndefined(label)) {
                            var otherLang = _.first(_.without(availLangs, scope.lang));
                            label = obj["label"][otherLang];
                        }

                        // If filter is string, add typeahead to it
                        //todo

                        // Return the filter
                        return {
                            id: obj["id"].replace(/\W/g, ''),
                            label: label,
                            type: obj["type"]                           //todo: add date time plugin
                        };
                    });

                    return newFilters;
                };

                /**
                 * Recursive function that checks if a group has the specified rule, and sets its value
                 * If a rule is a group, it calls itself with that group as parameter
                 * @param group		Group to search inside
                 * @param ruleId	id of the rule to find
                 * @param value		Value to give to the rule
                 */
                var setRule = function(group, ruleId, value) {
                    // For each rule, check if it has the desired id or if it's a group, check inside of it
                    _.each(group.rules, function(rule) {
                        if (_.has(rule, "rules")) {
                            setRule(rule, ruleId, value);
                        } else {
                            if (rule.id == ruleId) {
                                rule.value = value;
                            }
                        }
                    });
                };

                /**
                 * Runs when something is selected in the Angular UI Bootstrap typeahead popup, and updates
                 * the value in jQuery Query Builder's model because it is not getting updated on its own.
                 * @param ruleId        id of the rule that changed
                 * @param selectedItem  item that was selected
                 */
                scope.typeaheadSelectHandler = function(ruleId, selectedItem) {
                    // Get root model
                    var rootModel = $("#" + scope.builderId).queryBuilder('getModel');

                    // Set rule's value in the model
                    setRule(rootModel, ruleId, selectedItem);
                };

                /**
                 * Function to get search suggestions from the Search service
                 * @param val   Input from the search bar
                 */
                scope.getSuggestions = function(val) {
                    return Search.getSearchSuggestions(val, scope.lang, scope.maxSuggestions);
                };

            }
        };
    }
]);