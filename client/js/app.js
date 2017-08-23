/*global angular*/

(function() {
    const app = angular.module("census-elements", ["census-services"]);

    app.directive("pagination", function() {
        return {
            restrict: "E",
            templateUrl: "pagination.html",
            controller: function(ListService, FilterService) {
                var self = this;
                self.numbersList = [];
                self.data = ListService.data;
                self.filter = FilterService;
                self.filter.data.page = 1;

                self.isSelected = function(thePage) {
                    return thePage === self.filter.data.page;
                };

                self.setPage = function(thePage) {
                    self.filter.data.page = thePage;
                    ListService.request(self.filter.data);
                };

                self.isNextDisabled = function() {
                    if (self.data.pagination)
                        return self.filter.data.page >= self.data.pagination.totalPages;
                    return true;
                };

                self.isPreviousDisabled = function() {
                    return self.filter.data.page <= 1;
                };

                self.next = function() {
                    if (self.isNextDisabled())
                        return;
                    self.setPage(self.filter.data.page + 1);
                };

                self.previous = function() {
                    if (self.isPreviousDisabled())
                        return;

                    self.setPage(self.filter.data.page - 1);
                };
            },
            controllerAs: "pgCtrl"
        };
    });

    app.directive("gnomeTabs", function() {
        return {
            restrict: "E",
            templateUrl: "gnome-tabs.html",
            controller: function() {
                var self = this;
                self.tab = 1;

                self.setTab = function(newValue) {
                    self.tab = newValue;
                };

                self.isSet = function(tabName) {
                    return self.tab === tabName;
                };

                self.hasFriends = function(gnome){
                    return gnome.friends.length > 0;
                };

                self.hasJobs = function(gnome){
                    return gnome.professions.length > 0;
                };

                self.getGender = function(gnome){
                    return gnome.gender.gender || "?";
                };
            },
            controllerAs: "tabsCtrl"
        };
    });

    app.directive("gnomeFilter", function() {
        return {
            restrict: "E",
            templateUrl: "gnome-filter.html",
            controller: function(ListService, FilterService) {
                var self = this;
                self.filter = FilterService;
                self.filter.data.itemsPerPage = 3;

                self.makeRequest = function() {
                    self.filter.data.page = 1;
                    ListService.request(self.filter.data);
                };
            },
            controllerAs: "filterCtrl"
        };
    });

    app.directive("gnomeList", function() {
        return {
            restrict: "E",
            templateUrl: "gnome-list.html",
            controller: function(ListService) {
                var self = this;
                ListService.request({
                    itemsPerPage: 3
                });
                self.list = ListService.data;
            },
            controllerAs: "listCtrl"
        };
    });
}());
