angular.module('yds').directive('ydsGridResults', ['Data', 'Filters', 'Search', 'Basket', 'YDS_CONSTANTS', '$location',
    function(Data, Filters, Search, Basket, YDS_CONSTANTS, $location){
        return {
            restrict: 'E',
            scope: {
                viewType: '@',          // name of the view to use for the grid
                lang: '@',              // lang of the visualised data

                sorting: '@',           // enable or disable array sorting, values: true, false
                filtering: '@',         // enable or disable array filtering, values: true, false
                quickFiltering: '@',    // enable or disable array quick filtering, values: true, false
                colResize: '@',         // enable or disable column resize, values: true, false
                pageSize: '@',          // set the number of rows of each page
                elementH: '@',          // set the height of the component

                addToBasket: '@',       // enable or disable "add to basket" functionality, values: true, false
                basketBtnX: '@',        // x-axis position of the basket button
                basketBtnY: '@'         // y-axis position of the basket button
            },
            templateUrl:'templates/grid-advanced.html',
            link: function(scope, element) {
                //reference the dom elements in which the yds-grid is rendered
                var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
                var gridContainer = angular.element(element[0].querySelector('.grid-container'));

                //set the variables which will be used for the creation of the grid
                scope.quickFilterValue = "";
                var grid = {
                    elementId: "grid" + Data.createRandomId(),
                    viewType: scope.viewType,
                    lang: scope.lang,
                    sorting: scope.sorting,
                    filtering: scope.filtering,
                    quickFiltering: scope.quickFiltering,
                    colResize: scope.colResize,
                    pageSize: scope.pageSize,
                    elementH: scope.elementH
                };

                // if viewType is undefined we can't show the grid
                if(_.isUndefined(grid.viewType) || grid.viewType.trim()=="") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the viewType attribute isn't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                //check if the language attr is defined, else assign default value
                if(angular.isUndefined(grid.lang) || grid.lang.trim()=="")
                    grid.lang = "en";

                //check if the sorting attr is defined, else assign the default value
                if(angular.isUndefined(grid.sorting) || (grid.sorting!="true" && grid.sorting!="false"))
                    grid.sorting = "true";

                //check if the filtering attr is defined, else assign the default value
                if(angular.isUndefined(grid.filtering) || (grid.filtering!="true" && grid.filtering!="false"))
                    grid.filtering = "false";

                //check if the quick filtering attr is defined, else assign the default value
                if(angular.isUndefined(grid.quickFiltering) || (grid.quickFiltering!="true" && grid.quickFiltering!="false"))
                    grid.quickFiltering = "false";

                //check if the colResize attr is defined, else assign default value
                if(angular.isUndefined(grid.colResize) || (grid.colResize!="true" && grid.colResize!="false"))
                    grid.colResize = "false";

                //check if the page size attr is defined, else assign default value
                if(angular.isUndefined(grid.pageSize) || isNaN(grid.pageSize))
                    grid.pageSize = "100";

                //check if the component's height attr is defined, else assign default value
                if(angular.isUndefined(grid.elementH) || isNaN(grid.elementH))
                    grid.elementH = 200 ;

                //set the id and the height of the grid component
                gridContainer[0].id = grid.elementId;

                if (grid.quickFiltering === "true") {
                    gridWrapper[0].style.height = (grid.elementH) + 'px';
                    gridContainer[0].style.height = (grid.elementH - 35) + 'px';
                } else {
                    gridWrapper[0].style.height = grid.elementH + 'px';
                }

                /**
                 * function which is being registered to the FilterModified event
                 * when a filter is updated, it updates the filter obj of the component by using the Filters Service
                 */
                var filterModifiedListener = function() {
                    var gridFilters = {};

                    //get all filters applied to the columns
                    if (grid.filtering === "true")
                        gridFilters = scope.gridOptions.api.getFilterModel();

                    //if quick filtering is enabled and has length>0, get its value and create an extra filter
                    if (grid.quickFiltering === "true")
                        gridFilters['_ydsQuickFilter_'] = scope.quickFilterValue;

                    Filters.addGridFilter(grid.elementId, gridFilters);
                };

                /**
                 * function to handle grid's quick filtering
                 */
                scope.applyQuickFilter = function(input) {
                    scope.gridOptions.api.setQuickFilter(input);
                };

                /**
                 * function to be called on destroy of the component
                 */
                scope.$on("$destroy", function() {
                    //if the grid filtering is enabled remove the filter event listener
                    if (grid.filtering === "true" || grid.quickFiltering === "true") {
                        scope.gridOptions.api.removeEventListener('afterFilterChanged', filterModifiedListener);
                        Filters.remove(grid.elementId);
                    }
                });

                scope.$watch(function () { return $location.search().tab }, function (tabLabel) {
                    //todo: check if tab is active to size columns
                    // If grid options are ready, size columns to fit
                    if (!_.isUndefined(scope.gridOptions) && _.has(scope.gridOptions, "api")) {
                        scope.gridOptions.api.sizeColumnsToFit();
                    }
                });

                scope.$watch(function () { return getKeyword(); }, function () {
                    visualizeGrid();
                });

                /**
                 * Function called when the "Apply" button is clicked
                 */
                scope.applyComboFilters = function() {
                    var trimmedQFValue = scope.quickFilterValue.trim();
                    if (trimmedQFValue.length>0) {
                        visualizeGrid(trimmedQFValue);
                    }
                };

                /**
                 * Clears the quick filter
                 */
                scope.clearComboFilters = function() {
                    scope.applyQuickFilter("");
                    scope.quickFilterValue = "";

                    visualizeGrid();
                };

                /**
                 * Finds the first available view for a data type
                 * @param possibleViewNames
                 * @param availableViews
                 * @returns {*}
                 */
                var findView = function(possibleViewNames, availableViews) {
                    var responseView = undefined;

                    // Check if any of the possible views for the data exist
                    _.each(possibleViewNames, function (viewToFind) {
                        _.each(availableViews, function (view) {
                            if (!_.isUndefined(view[viewToFind]) && _.isUndefined(responseView)) {
                                responseView = view[viewToFind];
                            }
                        });
                    });

                    return responseView;
                };

                /**
                 * Gets the current keyword from the search service
                 * @returns {*}
                 */
                var getKeyword = function() {
                    var newKeyword = Search.getKeyword();

                    if (_.isUndefined(newKeyword) || newKeyword.trim() == "") {
                        newKeyword = "*";
                    }

                    return newKeyword;
                };

                /**
                 * Adds 2 columns to the column definitions of a grid in which
                 * the "view" and "add to basket" buttons will be
                 * @param columnDefs    Column definitions array as returned by Data.prepareGridColumns()
                 * @returns {Array.<*>} New column definitions
                 */
                var addButtonsToColumnDefs = function(columnDefs) {
                    var newColDefs = [
                        { field: "viewBtn", headerName: "", width: 45, suppressSorting: true, suppressMenu: true, suppressSizeToFit: true }
                        // { field: "basketBtn", headerName: "", width: 60, suppressSorting: true, suppressMenu: true }
                    ];

                    return newColDefs.concat(columnDefs);
                };

                /**
                 * Adds "View" and "Add to basket" buttons to the data
                 * @param rows      Table rows to add buttons to
                 * @returns {Array} Table rows with buttons
                 */
                var addButtonsToGridData = function(rows) {
                    var newRows = [];

                    _.each(rows, function(row) {
                        var viewBtnUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL + "?id=" + row.id + "&type=" + grid.viewType;

                        row.viewBtn = "<a href='" + viewBtnUrl + "' class='btn btn-xs btn-primary' target='_blank' style='margin-top: -4px'>View</a>";
                        // row.basketBtn = "<a href='" + viewBtnUrl + "' class='btn btn-xs btn-success' target='_blank' style='margin-top: -4px'>Basket</a>";

                        newRows.push(row);
                    });

                    return newRows;
                };

                /**
                 * Function to render the grid
                 */
                var visualizeGrid = function(quickFilter) {
                    // Create grid data source
                    var dataSource = {
                        maxPagesInCache: 10,
                        pageSize: parseInt(grid.pageSize),
                        getRows: function (params) {
                            // Get the search keyword, and merge it with the quick filter if it's defined
                            var keyword = getKeyword();
                            if (!_.isUndefined(quickFilter)) {
                                keyword = "(" + keyword + ") AND " + quickFilter;
                            }

                            // Get data for this page and search term from the server
                            Data.getGridResultData(keyword, grid.viewType, params.startRow, grid.pageSize, grid.lang)
                                .then(function(response) {
                                    // Extract needed variables from server response
                                    var responseData = response.data.response.docs;             // Get actual results

                                    // If there are no results, show empty grid
                                    if (_.isEmpty(responseData)) {
                                        params.successCallback(responseData, 0);
                                        return;
                                    }

                                    // Create array with possible view names (view type of tab should always be preferred)
                                    var resultTypes = _.first(responseData).type;
                                    var possibleViewNames = _.union([grid.viewType], resultTypes);

                                    // Find correct view for these results and their number
                                    var responseView = findView(possibleViewNames, response.view);
                                    var numOfResults = response.data.response.numFound;

                                    // Format the column definitions returned from the API and add 2 extra columns to them
                                    var columnDefs = Data.prepareGridColumns(responseView);
                                    var colDefsWithButtons = addButtonsToColumnDefs(columnDefs);

                                    scope.gridOptions.api.setColumnDefs(colDefsWithButtons);

                                    // Format the data returned from the API and add them to the grid
                                    var rowsThisPage = Data.prepareGridData(responseData, responseView);

                                    // Check if any rows have no value for some attribute
                                    _.each(rowsThisPage, function(row) {
                                        // for each column of the table
                                        _.each(responseView, function(column) {
                                            var attr = column.attribute;

                                            // if it's undefined, try to find it with similar attribute name
                                            if (_.isUndefined(row[attr])) {
                                                var newValue = Data.findValueInResult(row, attr, Search.geti18nLangs(), grid.lang);

                                                if (_.isUndefined(newValue)) {
                                                    newValue = "";
                                                } else if (_.isArray(newValue)) {
                                                    newValue = newValue.join(", ");
                                                }

                                                Data.createNestedObject(row, attr.split("."), newValue);
                                            }
                                        });
                                    });

                                    // Add view button for viewing more info about the result
                                    var rowsWithButtons = addButtonsToGridData(rowsThisPage);

                                    params.successCallback(rowsWithButtons, numOfResults);

                                    // Call sizeColumnsToFit (for the visible grid when page loads)
                                    //todo: check if tab is active to size columns
                                    scope.gridOptions.api.sizeColumnsToFit();
                                }, function(error) {
                                    scope.ydsAlert = error.message;
                                });
                        }
                    };

                    // If the grid is being rendered for the first time, create it with the datasource
                    if (_.isUndefined(scope.gridOptions)) {
                        // Define the options of the grid component
                        scope.gridOptions = {
                            columnDefs: [],
                            enableColResize: true,
                            virtualPaging: true,
                            datasource: dataSource
                        };

                        new agGrid.Grid(gridContainer[0], scope.gridOptions);
                    } else {
                        // Add new data source to the grid
                        scope.gridOptions.api.setDatasource(dataSource);
                    }
                };
            }
        };
    }
]);