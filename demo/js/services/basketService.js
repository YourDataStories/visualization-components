angular.module('yds').factory('Basket', ['YDS_CONSTANTS', 'Data', '$q', '$http', '$uibModal',
    function (YDS_CONSTANTS, Data, $q, $http, $uibModal) {
        var basketCallbacks = [];
        var lastSavedItem = {};
        var modalInstance = {};
        var userId = "";

        var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
            angular.forEach(observerStack, function (callback) {
                callback();
            });
        };

        //private function accessible only through the BasketModalCtrl in order to close the modalInstance
        var closeModal = function () {
            modalInstance.close();
        };

        return {
            registerCallback: function (callback) {
                basketCallbacks.push(callback);
            },
            getLastSavedItem: function () {
                return lastSavedItem;
            },
            setUserId: function (newUserId) {
                userId = newUserId;
            },
            getUserId: function () {
                return userId;
            },
            openModal: function (basketInput, modalRestrictions) {
                var modalInput = {
                    title: "Add to Library",
                    closeModal: closeModal,
                    modalRestrict: modalRestrictions
                };

                modalInstance = $uibModal.open({
                    animation: false,
                    controller: 'BasketModalCtrl',
                    templateUrl: Data.templatePath + 'templates/basket-modal.html',
                    size: 'md',
                    resolve: {
                        basketInput: function () {
                            return basketInput;
                        },
                        modalInput: function () {
                            return modalInput;
                        }
                    }
                });

                return modalInstance;
            },
            openDashboardModal: function (basketInput, modalConfig) {
                var modalInput = {
                    title: "Save filters to Library",
                    closeModal: closeModal,
                    infoType: modalConfig.infoType,
                    lang: modalConfig.lang
                };

                modalInstance = $uibModal.open({
                    controller: "DashboardConfigModalCtrl",
                    templateUrl: Data.templatePath + 'templates/dashboard/dashboard-config-save-modal.html',
                    size: "md",
                    resolve: {
                        basketInput: function () {
                            return basketInput;
                        },
                        modalInput: function () {
                            return modalInput;
                        }
                    }
                });

                return modalInstance;
            },
            formatBasketTags: function (tagsString) {
                //tokenize the basket item tags and save them to the basket item obj
                //if not tag is available, assign the default value "untagged"
                var basketTags = [];
                tagsString = tagsString.trim();
                if (tagsString.length > 0) {
                    var tmpTags = tagsString.split(',');

                    _.each(tmpTags, function (tag) {
                        basketTags.push(tag.trim());
                    });
                } else {
                    basketTags.push("untagged");
                }

                return basketTags;
            },
            checkIfItemExists: function (bskItem) {
                var deferred = $q.defer();

                $http({
                    method: 'GET',
                    url: YDS_CONSTANTS.BASKET_URL + "exists_item",
                    headers: {'Content-Type': 'application/json; charset=UTF-8'},
                    params: bskItem
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            saveBasketItem: function (bskItem) {
                var deferred = $q.defer();
                lastSavedItem = angular.copy(bskItem);

                // Use correct URL path depending on whether we are saving a dataset/visualisation or a Dashboard configuration
                var urlSuffix = "save";
                if (bskItem.type == "dashboard") {
                    // Use URL for saving Dashboard filter configurations
                    urlSuffix = "save_dashboard";
                }

                $http({
                    method: 'POST',
                    url: YDS_CONSTANTS.BASKET_URL + urlSuffix,
                    headers: {'Content-Type': 'application/json'},
                    data: JSON.stringify(bskItem)
                }).then(function (response) {
                    notifyObservers(basketCallbacks);
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            getBasketItem: function (userId, basketItemId) {
                var deferred = $q.defer();

                $http({
                    method: 'GET',
                    url: YDS_CONSTANTS.BASKET_URL + "retrieve/" + userId + "/" + basketItemId,
                    headers: {'Content-Type': 'application/json'}
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            getBasketItems: function (userId, type) {
                var deferred = $q.defer();

                var contType = "";
                switch (type.toLowerCase()) {
                    case "dataset":
                        contType = "?basket_type=dataset";
                        break;
                    case "visualisation":
                        contType = "?basket_type=visualisation";
                        break;
                    case "dashboard":
                        contType = "?basket_type=dashboard";
                        break;
                }

                $http({
                    method: 'GET',
                    url: YDS_CONSTANTS.BASKET_URL + "get/" + userId + contType,
                    headers: {'Content-Type': 'application/json'}
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            deleteBasketItems: function (userId, type, bskID) {
                var deferred = $q.defer();

                var removePath = "remove/";
                if (type === "Dashboard") {
                    removePath = "removeDashboards/";
                }

                $http({
                    method: 'POST',
                    url: YDS_CONSTANTS.BASKET_URL + removePath + userId,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function (obj) {
                        var str = [];
                        for (var p in obj)
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        return str.join("&");
                    },
                    data: {
                        "basket_item_id": bskID
                    }
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }
        }
    }]);

angular.module('yds').controller('BasketModalCtrl', function ($scope, modalInput, basketInput, Basket) {
    //configuration of the shown modal
    $scope.modalConfig = {
        restriction: modalInput.modalRestrict,
        closeModal: modalInput.closeModal,
        title: modalInput.title,
        alert: ""
    };

    //prepare the basket item
    $scope.basketObj = {
        title: "",
        type: basketInput.type,
        filters: basketInput.filters,
        lang: basketInput.lang,
        user_id: basketInput.user_id,
        content_type: basketInput.content_type,
        component_parent_uuid: basketInput.component_parent_uuid,
        component_type: basketInput.component_type,
        is_private: true,
        tags: ""
    };

    //function to save a basket item
    $scope.saveBasketItem = function () {
        if ($scope.basketObj.title.trim().length == 0) {
            $scope.modalConfig.alert = "Please provide a title for your item";
            return false;
        } else
            $scope.basketObj.tags = Basket.formatBasketTags($scope.basketObj.tags);

        //call the service to check if basket item exists
        Basket.saveBasketItem($scope.basketObj)
            .then(function (response) {
                $scope.clearModalWarnings($scope.modalConfig);
                $scope.dismissModal();
            }, function (error) {
                $scope.modalConfig.alert = "An error occurred, please try again";
            });
    };

    //function to clear modal warning messages
    $scope.clearModalWarnings = function (modalConfig) {
        if (modalConfig.alert.trim().length > 0)
            modalConfig.alert = "";
    };

    //function to be called when the modal's cancel button is pressed
    $scope.dismissModal = function () {
        $scope.modalConfig.closeModal();
    }
});
