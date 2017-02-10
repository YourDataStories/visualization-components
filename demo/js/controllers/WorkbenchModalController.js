angular.module('yds').controller('WorkbenchModalController', ['$uibModalInstance', '$scope', '$timeout', 'Basket',
    function($uibModalInstance, $scope, $timeout, Basket) {
        var scope = $scope;

        var myData = {"chart":{"type":"bubble"},"title":{"text":"Συμβόλαια/Αποφάσεις"},"legend":{"enabled":true,"shadow":false},"xAxis":{"title":{"text":"Ημερομηνία"},"type":"datetime","gridLineWidth":1},"plotOptions":{"series":{"allowPointSelect":true,"dataLabels":{"enabled":true,"format":"{point.z:,.0f} €"}}},"yAxis":{"title":{"text":"Ποσό (€)"},"type":"linear","gridLineWidth":1},"series":[{"name":"Ποσό (€)","data":[{"x":1343347200000,"y":47388,"z":47388,"title":"Contract"},{"x":1343779200000,"y":10925,"z":10925,"title":"Contract"},{"x":1368748800000,"y":34693,"z":34693,"title":"Contract"},{"x":1368748800000,"y":14514,"z":14514,"title":"Contract"},{"x":1379635200000,"y":55239,"z":55239,"title":"Contract"},{"x":1395964800000,"y":38405,"z":38405,"title":"Contract"},{"x":1441065600000,"y":32465,"z":32465,"title":"Contract"},{"x":1242950400000,"y":15000,"z":15000,"title":"Contract"},{"x":1397520000000,"y":558000,"z":558000,"title":"Contract"},{"x":1419811200000,"y":201275,"z":201275,"title":"Contract"},{"x":1400112000000,"y":60000,"z":60000,"title":"Contract"},{"x":1400112000000,"y":38000,"z":38000,"title":"Contract"},{"x":1394841600000,"y":42000,"z":42000,"title":"Contract"},{"x":1381881600000,"y":8180,"z":8180,"title":"Contract"},{"x":1419984000000,"y":5000,"z":5000,"title":"Contract"},{"x":1399507200000,"y":336439,"z":336439,"title":"Contract"},{"x":1431388800000,"y":25017,"z":25017,"title":"Contract"},{"x":1286236800000,"y":311627,"z":311627,"title":"Contract"},{"x":1286409600000,"y":199359,"z":199359,"title":"Contract"},{"x":1437436800000,"y":69125,"z":69125,"title":"Contract"},{"x":1292976000000,"y":977914,"z":977914,"title":"Contract"},{"x":1360886400000,"y":3759341,"z":3759341,"title":"Contract"},{"x":1445299200000,"y":36840,"z":36840,"title":"Contract"},{"x":1334620800000,"y":665636,"z":665636,"title":"Contract"},{"x":1348444800000,"y":22927,"z":22927,"title":"Contract"},{"x":1394409600000,"y":12075,"z":12075,"title":"Contract"},{"x":1393545600000,"y":4000,"z":4000,"title":"Contract"},{"x":1399248000000,"y":48468,"z":48468,"title":"Contract"},{"x":1399248000000,"y":40000,"z":40000,"title":"Contract"},{"x":1442966400000,"y":650,"z":650,"title":"Contract"},{"x":1400112000000,"y":650,"z":650,"title":"Contract"},{"x":1394409600000,"y":18450,"z":18450,"title":"Contract"},{"x":1399248000000,"y":364643,"z":364643,"title":"Contract"},{"x":1399248000000,"y":48283,"z":48283,"title":"Contract"},{"x":1443139200000,"y":1676,"z":1676,"title":"Contract"},{"x":1400112000000,"y":1676,"z":1676,"title":"Contract"},{"x":1365120000000,"y":2138191,"z":2138191,"title":"Contract"},{"x":1357862400000,"y":40000,"z":40000,"title":"Contract"},{"x":1368403200000,"y":764803,"z":764803,"title":"Contract"},{"x":1374451200000,"y":318086,"z":318086,"title":"Contract"},{"x":1379894400000,"y":34000,"z":34000,"title":"Contract"},{"x":1383091200000,"y":58140,"z":58140,"title":"Contract"},{"x":1392163200000,"y":47000,"z":47000,"title":"Contract"},{"x":1388707200000,"y":277873,"z":277873,"title":"Contract"},{"x":1370304000000,"y":322667,"z":322667,"title":"Contract"},{"x":1388707200000,"y":290118,"z":290118,"title":"Contract"},{"x":1390176000000,"y":59500,"z":59500,"title":"Contract"},{"x":1400544000000,"y":1140572,"z":1140572,"title":"Contract"},{"x":1399852800000,"y":273606,"z":273606,"title":"Contract"},{"x":1290643200000,"y":207652,"z":207652,"title":"Contract"},{"x":1292284800000,"y":289737,"z":289737,"title":"Contract"},{"x":1336608000000,"y":126288,"z":126288,"title":"Contract"},{"x":1348444800000,"y":43275,"z":43275,"title":"Contract"},{"x":1311033600000,"y":17899,"z":17899,"title":"Contract"},{"x":1308873600000,"y":6150,"z":6150,"title":"Contract"},{"x":1358812800000,"y":22966,"z":22966,"title":"Contract"},{"x":1370217600000,"y":686085,"z":686085,"title":"Contract"},{"x":1386115200000,"y":2337,"z":2337,"title":"Contract"},{"x":1412121600000,"y":17899,"z":17899,"title":"Contract"},{"x":1256256000000,"y":434977,"z":434977,"title":"Contract"},{"x":1376352000000,"y":631300,"z":631300,"title":"Contract"},{"x":1289174400000,"y":45521,"z":45521,"title":"Contract"},{"x":1289174400000,"y":4515,"z":4515,"title":"Contract"},{"x":1290643200000,"y":293741,"z":293741,"title":"Contract"},{"x":1344816000000,"y":244770,"z":244770,"title":"Contract"},{"x":1334102400000,"y":239894,"z":239894,"title":"Contract"},{"x":1339372800000,"y":2285198,"z":2285198,"title":"Contract"},{"x":1355270400000,"y":486218,"z":486218,"title":"Contract"},{"x":1356048000000,"y":71710,"z":71710,"title":"Contract"},{"x":1412899200000,"y":138696,"z":138696,"title":"Contract"},{"x":1388707200000,"y":574861,"z":574861,"title":"Contract"}]},{"data":[]}],"credits":{"enabled":true}};

        // Get user ID from Basket service
        scope.userId = Basket.getUserId();

        scope.ok = function () {
            $uibModalInstance.close({
                chartConfig: myData
            });
        };

        scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);