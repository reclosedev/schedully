(function() {
  'use strict';

  angular
    .module('schedully')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $interval) {
    var vm = this;

    vm.appDB = window.APP_DB;
    vm.timeWindowMinutes = 2 * 60;
    vm.selectedSchedule = vm.appDB.schedules[0];
    vm.closestTimes = [];
    vm.refreshSchedule = refreshSchedule;

    activate();

    function activate() {
      var locationsById = {};
      angular.forEach(vm.appDB.locations, function (location) {
        locationsById[location.id] = location;
      });

      angular.forEach(vm.appDB.schedules, function (schedule) {
        schedule.from = locationsById[schedule.from];
        schedule.to = locationsById[schedule.to];
        for (var i = 0; i < schedule.times.length; i++) {
          var d = new Date();
          d.setHours(schedule.times[i][0], schedule.times[i][1], 0, 0);
          if (schedule.times[i][0] == 0) {
            d.setDate(d.getDate() + 2);
          }
          schedule.times[i] = d;
        }
      });
      var refreshInterval = $interval(refreshSchedule, 5 * 1000);
      $scope.$on('$destroy', function () {
        $interval.cancel(refreshInterval)
      });
      refreshSchedule();
    }

    function refreshSchedule() {
      vm.closestTimes = [];
      var timeNow = new Date();
      //timeNow.setHours(9, 30);
      console.log("Refresh " + timeNow);

      angular.forEach(vm.selectedSchedule.times, function (time) {
        var delta = moment(time).diff(timeNow, 'minutes');
        //console.log(timeNow + " " + time + " " + delta);
        if (delta >= 0 && delta < vm.timeWindowMinutes) {
          vm.closestTimes.push(time);
        }
      });
    }
  }
})();
