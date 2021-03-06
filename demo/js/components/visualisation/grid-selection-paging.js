/**
 * Grid that supports selection of items and paging (infinite scrolling) at the same time.
 */
angular.module("yds").directive("ydsGridSelectionPaging", ["Data", "Filters", "DashboardService",
    function (Data, Filters, DashboardService) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",         // ID of the project that the data belong
                viewType: "@",          // Name of the array that contains the visualised data
                lang: "@",              // Lang of the visualised data

                extraParams: "=",       // Extra attributes to pass to the API, if needed
                baseUrl: "@",           // Base URL to send to API (optional)

                sorting: "@",           // Enable or disable array sorting, values: true, false
                quickFiltering: "@",    // Enable or disable array quick filtering, values: true, false
                colResize: "@",         // Enable or disable column resize, values: true, false
                numberOfItems: "@",     // This should be set to the number of total items that the grid will show
                pageSize: "@",          // Set the number of rows of each page
                elementH: "@",          // Set the height of the component

                selectionType: "@",     // Selection type ("single" or "multiple")
                dashboardId: "@",       // Used for setting/getting parameters to/from DashboardService
                selectionId: "@",       // ID for saving the selection for the specified dashboardId
                ignoreOwnSelection: "@",// Set to true to ignore the grid's own selections (to prevent refreshing)
                checkboxInNewCol: "@",  // If true, the grid will add the selection checkboxes in a new column

                enableRating: "@"       // Enable rating buttons for this component
            },
            templateUrl: Data.templatePath + "templates/visualisation/grid.html",
            link: function (scope, element) {
                // Get the DOM elements that will contain the grid
                var gridWrapper = _.first(angular.element(element[0].querySelector(".component-wrapper")));
                var gridContainer = _.first(angular.element(element[0].querySelector(".grid-container")));

                // Set initial grid parameters
                var grid = {
                    elementId: "grid" + Data.createRandomId(),
                    projectId: scope.projectId,
                    viewType: scope.viewType,
                    lang: scope.lang,
                    sorting: scope.sorting,
                    quickFiltering: scope.quickFiltering,
                    colResize: scope.colResize,
                    pageSize: parseInt(scope.pageSize),
                    elementH: scope.elementH
                };

                var baseUrl = scope.baseUrl;
                var selectionType = scope.selectionType;
                var dashboardId = scope.dashboardId;
                var selectionId = scope.selectionId;
                var ignoreOwnSelection = scope.ignoreOwnSelection;

                // Quick filter scope variables
                scope.filters = {
                    quickFilterValue: ""
                };
                scope.showApplyBtn = true;  // Show apply button (when quick filtering is enabled)

                // If selection is enabled, this will be used to reselect rows after refreshing the grid data
                var selection = [];
                var hasColDefs = false; // Indicates if the column definitions have been loaded for the grid
                var dataView = null;
                var preventUpdate = false;

                // Check if project id or grid type are defined
                if (_.isUndefined(grid.projectId) || grid.projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                // Check if view-type attribute is empty and assign the default value
                if (_.isUndefined(grid.viewType) || grid.viewType.trim() === "")
                    grid.viewType = "default";

                // Check if the language attribute is defined, else assign default value
                if (_.isUndefined(grid.lang) || grid.lang.trim() === "")
                    grid.lang = "en";

                // Check if the sorting attribute is defined, else assign the default value
                if (_.isUndefined(grid.sorting) || (grid.sorting !== "true" && grid.sorting !== "false"))
                    grid.sorting = "true";

                // Check if the quick filtering attribute is defined, else assign the default value
                if (_.isUndefined(grid.quickFiltering) || (grid.quickFiltering !== "true" && grid.quickFiltering !== "false"))
                    grid.quickFiltering = "false";

                // Check if the colResize attribute is defined, else assign default value
                if (_.isUndefined(grid.colResize) || (grid.colResize !== "true" && grid.colResize !== "false"))
                    grid.colResize = "false";

                // Check if the page size attribute is defined, else assign default value
                if (_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = 100;

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200;

                // Check if the selectionType attribute is defined, else assign default value
                if (_.isUndefined(selectionType) || (selectionType !== "single" && selectionType !== "multiple"))
                    selectionType = "multiple";

                // Check if the checkboxInNewCol attribute is defined, else assign default value
                if (_.isUndefined(scope.checkboxInNewCol) || (scope.checkboxInNewCol !== "true" && scope.checkboxInNewCol !== "false"))
                    scope.checkboxInNewCol = "false";

                // Check if the ignoreOwnSelection attribute is defined, else assign default value
                if (_.isUndefined(ignoreOwnSelection) || (ignoreOwnSelection !== "true" && ignoreOwnSelection !== "false"))
                    ignoreOwnSelection = "false";

                // Show loading animation
                scope.loading = true;

                // Set the ID and height of the grid
                gridContainer.id = grid.elementId;
                if (grid.quickFiltering === "true") {
                    gridWrapper.style.height = (grid.elementH) + "px";
                    gridContainer.style.height = (grid.elementH - 55) + "px";
                } else {
                    gridWrapper.style.height = grid.elementH + "px";
                }

                // Set cookie variables
                var cookieKey = grid.viewType + "_" + dashboardId;
                var firstLoad = true;

                /**
                 * Apply the quick filter
                 */
                scope.applyComboFilters = function () {
                    if (scope.filters.quickFilterValue.trim().length > 0) {
                        // Re-create the grid
                        createGrid();
                    } else {
                        // Refresh the grid (removing spaces from the text field)
                        scope.clearComboFilters();
                    }
                };

                /**
                 * Clear the grid's filters
                 */
                scope.clearComboFilters = function () {
                    // Clear quick filter (& number of loaded rows, because the grid will refresh data)
                    scope.filters.quickFilterValue = "";

                    createGrid();
                };

                /**
                 * Select the ones that are indicated in the selection parameter (matches them by their "id" attribute)
                 * @param selection Rows to select. Should be array of ids.
                 */
                var selectRows = function (selection) {
                    // Deselect previously selected rows
                    if (!preventUpdate) {
                        // Prevent the next selection event from doing anything (because deselectAll() will fire it)
                        scope.gridOptions.api.deselectAll();
                    }

                    // Select new rows
                    var foundItems = [];
                    if (!_.isEmpty(selection)) {
                        scope.gridOptions.api.forEachNode(function (node) {
                            // Check if this node is in the selection
                            var nodeId = _.has(node.data, "id_original") ? node.data["id_original"] : node.data.id;
                            var isSelected = _.contains(selection, nodeId);

                            if (isSelected) {
                                // The node was selected before, so select it again
                                scope.gridOptions.api.selectNode(node, true);
                                foundItems.push(nodeId);
                            }

                            preventUpdate = false;
                        });

                        // Display warning in console if any items were dropped
                        if (foundItems.length < selection.length) {
                            console.warn("Some items were dropped because their nodes were not found!",
                                _.difference(selection, foundItems));
                        }
                    }
                };

                /**
                 * Get the IDs of the selected items of the grid.
                 * If there is an "id_original" attribute, use that, otherwise use the "id" attribute.
                 * @param gridSelection Selection from ag-grid
                 * @returns {*}         Array of IDs
                 */
                var getIdsFromSelection = function (gridSelection) {
                    if (_.has(_.first(gridSelection), "id_original")) {
                        return _.pluck(gridSelection, "id_original");
                    } else {
                        return _.pluck(gridSelection, "id");
                    }
                };

                /**
                 * Create the grid
                 */
                var createGrid = function () {
                    var dataSource = {
                        rowCount: null, // behave as infinite scroll
                        maxPagesInCache: 2,
                        overflowSize: grid.pageSize,
                        pageSize: grid.pageSize,
                        getRows: function (params) {
                            // Function to be called when grid results are retrieved successfully
                            var getDataSuccess = function (response) {
                                // Extract needed variables from server response
                                var responseData = response.data;
                                var responseView = response.view;

                                // Get number of results
                                scope.resultsNum = parseInt(scope.numberOfItems);

                                // Save the view in order to be able to use it for exporting
                                if (_.isNull(dataView)) {
                                    dataView = responseView;
                                }

                                // If there are no results, show empty grid
                                if (_.isEmpty(responseData)) {
                                    params.successCallback(responseData, 0);
                                    return;
                                }

                                if (!hasColDefs) {
                                    // Format the column definitions returned from the API and add 2 extra columns to them
                                    var columnDefs = Data.prepareGridColumns(dataView);

                                    // Check if we should add a new column for the checkboxes to go to
                                    if (scope.checkboxInNewCol === "true") {
                                        columnDefs.unshift({
                                            headerName: "",
                                            width: 30
                                        });
                                    }

                                    // Add checkboxes for selecting rows in the 1st column
                                    _.first(columnDefs).checkboxSelection = true;

                                    scope.gridOptions.api.setColumnDefs(columnDefs);
                                }

                                // Format the data returned from the API and add them to the grid
                                var rowsThisPage = Data.prepareGridData(responseData, responseView);

                                var lastRow = -1;
                                if (scope.resultsNum <= params.endRow) {
                                    // We reached the end, so set the last row to the number of total results
                                    lastRow = scope.resultsNum;
                                }

                                // If the rows returned are less than the page size, we reached the end
                                if (rowsThisPage.length < grid.pageSize) {
                                    lastRow = params.endRow - (grid.pageSize - rowsThisPage.length);
                                }

                                params.successCallback(rowsThisPage, lastRow);
                                hasColDefs = true;

                                // At first load of grid, check if there are any cookies with a selection for this grid
                                if (firstLoad) {
                                    var cookieSel = DashboardService.getCookieObject(cookieKey);

                                    if (!_.isEmpty(cookieSel)) {
                                        // Add selection from cookie to the selection variable, so the rows will be selected
                                        // below if selection is enabled
                                        selection = cookieSel;
                                    }

                                    firstLoad = false;
                                }

                                // Select any points that were previously selected
                                if (!_.isEmpty(selection)) {
                                    selectRows(selection);
                                }
                            };

                            // Function to be called when grid results retrieval fails
                            var getDataError = function (error) {
                                scope.ydsAlert = error.message;
                            };

                            var paramsToSend = _.clone(scope.extraParams);
                            if (_.isUndefined(paramsToSend)) {
                                paramsToSend = {};
                            }

                            if (!_.isUndefined(baseUrl) && !_.has(paramsToSend, "baseurl")) {
                                paramsToSend.baseurl = baseUrl;
                            }

                            // Add page size, starting row and sorting parameters
                            // (paging twice because in some cases rows/start is used, in others limit/offset)
                            paramsToSend = _.extend(paramsToSend, {
                                    rows: grid.pageSize,
                                    limit: grid.pageSize,
                                    start: params.startRow,
                                    offset: params.startRow
                                },
                                Data.formatAgGridSortParams(params.sortModel));

                            // Add quick filter to the extra parameters, if there's any
                            if (scope.filters.quickFilterValue.length > 0) {
                                paramsToSend["search_pattern"] = scope.filters.quickFilterValue;
                            }

                            // If extra params contains null value, prevent grid creation
                            var prevent = false;
                            _.each(paramsToSend, function (param) {
                                if (_.isString(param) && param.indexOf("null") !== -1)
                                    prevent = true;
                            });

                            if (prevent)
                                return;

                            Data.getProjectVis("grid", grid.projectId, grid.viewType, grid.lang, paramsToSend)
                                .then(getDataSuccess, getDataError);
                        }
                    };

                    if (_.isUndefined(scope.gridOptions)) {
                        scope.gridOptions = {
                            columnDefs: [],
                            enableColResize: (grid.colResize === "true"),
                            enableServerSideSorting: (grid.sorting === "true"),
                            rowSelection: selectionType,
                            suppressRowClickSelection: true,
                            virtualPaging: true,
                            datasource: dataSource,
                            onSelectionChanged: function (e) {
                                // Ignore event if grid is loading, or it's marked to be skipped
                                if (scope.loading) {
                                    return;
                                }

                                // Prevent next grid update if nothing was deselected
                                preventUpdate = !(!_.isEmpty(selection) && e.selectedRows.length < selection.length);

                                // Get selected row IDs
                                var selRows = getIdsFromSelection(e.selectedRows);

                                // Set selected rows in DashboardService
                                DashboardService.setGridSelection(selectionId, selRows);
                                selection = _.clone(selRows);

                                // Save selection to cookies too
                                DashboardService.setCookieObject(cookieKey, selRows);
                            }
                        };

                        new agGrid.Grid(gridContainer, scope.gridOptions);
                    } else {
                        // Add new data source to the grid
                        scope.gridOptions.api.setDatasource(dataSource);
                    }

                    scope.loading = false;
                };

                // Watch for changes in extra parameters and update the grid
                scope.$watch("extraParams", function (newValue, oldValue) {
                    if (ignoreOwnSelection === "true") {
                        // Remove own selection from the extra params, to not cause a refresh...
                        newValue = _.omit(newValue, selectionId);
                        oldValue = _.omit(oldValue, selectionId);
                    }

                    // Check if the grid should update (ignoring the grid's own selections)
                    if (!_.isEqual(newValue, oldValue) && !preventUpdate) {
                        // Show loading animation and hide any errors
                        scope.loading = true;
                        scope.ydsAlert = "";

                        createGrid();
                    }

                    preventUpdate = false;
                });

                // Watch for changes in the selection and select the appropriate rows
                DashboardService.subscribeGridSelectionChanges(scope, function () {
                    var selection = DashboardService.getGridSelection(selectionId);
                    selectRows(selection);
                });

                createGrid();
            }
        };
    }
]);
