(function() {
  'use strict';

  angular
    .module('schedully')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $interval) {
    var vm = this;

    vm.appDB = null;
    vm.timeWindowMinutes = 2 * 60; // two hours
    vm.selectedSchedule = null;
    vm.closestTimes = [];
    vm.refreshSchedule = refreshSchedule;

    activate();


    function activate(){
      prepareScheduleForDay();
      refreshSchedule();

      var prepareInterval = $interval(prepareScheduleForDay, 60 * 60 * 1000);
      var refreshInterval = $interval(refreshSchedule, 5 * 1000);
      $scope.$on('$destroy', function () {
        $interval.cancel(refreshInterval);
        $interval.cancel(prepareInterval);
      });
    }

    function prepareScheduleForDay() {
      console.log("Prepare");

      vm.appDB = _.cloneDeep(window.APP_DB);
      vm.selectedSchedule = vm.appDB.schedules[0];

      var locationsById = {};
      angular.forEach(vm.appDB.locations, function (location) {
        locationsById[location.id] = location;
      });

      angular.forEach(vm.appDB.schedules, function (schedule) {
        schedule.from = locationsById[schedule.from];
        schedule.to = locationsById[schedule.to];
        for (var i = 0; i < schedule.times.length; i++) {
          var date = new Date();
          date.setHours(schedule.times[i][0], schedule.times[i][1], 0, 0);
          if (schedule.times[i][0] == 0) {
            date.setDate(date.getDate() + 2);
          }
          schedule.times[i] = date;
        }
      });
    }

    function refreshSchedule() {
      vm.closestTimes = [];
      var timeNow = new Date();
      //timeNow.setHours(9, 30);
      console.log("Refresh " + timeNow);

      angular.forEach(vm.selectedSchedule.times, function (time) {
        var delta = moment(time).diff(timeNow, 'minutes');
        if (delta >= 0 && delta < vm.timeWindowMinutes) {
          vm.closestTimes.push(time);
        }
      });
    }
  }
})();
