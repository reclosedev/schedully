(function() {
  'use strict';

  angular
    .module('schedully')
    .controller('MainController', MainController);

    /** @ngInject */
  function MainController($scope, $interval, $geolocation, $log) {
    var vm = this;

    vm.appDB = null;
    vm.timeWindowMinutes = 2 * 60; // two hours
    vm.selectedSchedule = null;
    vm.closestTimes = [];
    vm.refreshSchedule = refreshSchedule;
    vm.currentPosition = $geolocation.position;

    activate();


    function activate() {
      prepareScheduleForDay();
      refreshSchedule();


      var geoOptions = {
            timeout: 60000,
            maximumAge: 1000,
            enableHighAccuracy: true
      };
      $geolocation.getCurrentPosition(geoOptions).then(refreshSchedule);
      $geolocation.watchPosition();

      var prepareInterval = $interval(prepareScheduleForDay, 60 * 60 * 1000);
      var refreshInterval = $interval(refreshSchedule, 5 * 1000);
      $scope.$on('$destroy', function () {
        $interval.cancel(refreshInterval);
        $interval.cancel(prepareInterval);
      });
    }

    function prepareScheduleForDay() {
      $log.info("Prepare data for new day");

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

      // DEBUG
      if (0){
        timeNow.setHours(9, 30);
        vm.currentPosition = {
          coords: {latitude: 10, longitude: 10}
        }
      }

      $log.debug("Refresh " + timeNow);

      sortNearestAndSelect();

      angular.forEach(vm.selectedSchedule.times, function (time) {
        var delta = moment(time).diff(timeNow, 'minutes');
        if (delta >= 0 && delta < vm.timeWindowMinutes) {
          vm.closestTimes.push(time);
        }
      });
    }

    function sortNearestAndSelect() {
      if (vm.currentPosition && vm.currentPosition.coords) {
        vm.appDB.schedules = _.sortBy(vm.appDB.schedules, function (schedule) {

          schedule.from.places = _.sortBy(schedule.from.places, function (place) {
            var dist = haversine(vm.currentPosition.coords, place.location);
            place.distance = dist;
            return dist
          });
          return schedule.from.places[0].distance;
        });
        vm.selectedSchedule = vm.appDB.schedules[0];
      }
    }
  }
})();
