angular.module('yds').directive('ydsBar', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',
            embeddable: '@',
            embedBtnX: '@',
            embedBtnY: '@',
            popoverPos: '@',
            titleX: '@',
            titleY: '@',
            showLabelsX: '@',
            showLabelsY: '@',
            showLegend: '@',
            exporting: '@',
            elementH: '@',
            titleSize: '@'
        },
        templateUrl: 'templates/bar.html',
        link: function (scope, element, attrs) {
            scope.enableEmbed = false;  //flag that indicates if the embed functionality is enabled

            var barContainer = angular.element(element[0].querySelector('.bar-container'));

            //create a random id for the element that will render the chart
            var elementId = "bar" + Data.createRandomId();
            barContainer[0].id = elementId;

            var embeddable = scope.embeddable;
            var titleX = scope.titleX;
            var titleY = scope.titleY;
            var showLabelsX = scope.showLabelsX;
            var showLabelsY = scope.showLabelsY;
            var showLegend = scope.showLegend;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the user has enabled the embed functionality
            if (!angular.isUndefined(embeddable) && embeddable=="true")
                scope.enableEmbed = true;

            //check if the x-axis title attr is defined, else assign the default value
            if(angular.isUndefined(titleX) || titleX.length==0)
                titleX = "";

            //check if the y-axis title attr is defined, else assign the default value
            if(angular.isUndefined(titleY) || titleY.length==0)
                titleY = "";

            //check if the x-axis showLabels attr is defined, else assign default value
            if(angular.isUndefined(showLabelsX) || (showLabelsX!="true" && showLabelsX!="false"))
                showLabelsX = "true";

            //check if the y-axis showLabels attr is defined, else assign default value
            if(angular.isUndefined(showLabelsY) || (showLabelsY!="true" && showLabelsY!="false"))
                showLabelsY = "true";

            //check if the showLegend attr is defined, else assign default value
            if(angular.isUndefined(showLegend) || (showLegend!="true" && showLegend!="false"))
                showLegend = "true";

            //check if the exporting attr is defined, else assign default value
            if(angular.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
                exporting = "true";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200 ;

            //check if the component's title size attr is defined, else assign default value
            if(angular.isUndefined(titleSize) || isNaN(titleSize))
                titleSize = 18 ;

            //set the height of the chart
            barContainer[0].style.height = elementH + 'px';

            Data.projectVisualization(scope.projectId,"bar")
            .then(function (response) {
                //check if the component is properly rendered

                if (angular.isUndefined(response.data) || !_.isArray(response.data) ||
                    angular.isUndefined(response.title) || angular.isUndefined(response.categories)||
                    !_.isArray(response.categories)) {

                    scope.ydsAlert = "The YDS component is not properly configured." +
                        "Please check the corresponding documentation section";
                    return false;
                }

                var options = {
                    chart: {
                        type: 'column',
                        renderTo: elementId
                    },
                    title: {
                        text: response.title,
                        style: {
                            fontSize: titleSize + "px"
                        }
                    },
                    xAxis: {
                        categories: response.categories,
                        crosshair: true,
                        title : { text: titleX },
                        labels: { enabled: (showLabelsX === "true") }
                    },
                    yAxis: {
                        title : { text: titleY },
                        labels: { enabled: (showLabelsY === "true") }
                    },
                    legend: {
                        enabled: (showLegend === "true")
                    },
                    exporting: {
                        enabled: (exporting === "true")
                    },
                    tooltip: {
                        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
                        footerFormat: '</table>',
                        shared: true,
                        useHTML: true
                    },
                    plotOptions: {
                        column: {
                            pointPadding: 0.2,
                            borderWidth: 0
                        }
                    },
                    series: response.data
                };

                var chart = new Highcharts.Chart(options);
            }, function (error) {
                console.log('error', error);
            });
        }
    };
}]);