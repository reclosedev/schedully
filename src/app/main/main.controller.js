(function() {
  'use strict';

  angular
    .module('schedully')
    .controller('MainController', MainController);

    /** @ngInject */
  function MainController($interval, $geolocation, $log) {
    var vm = this;

    vm.appDB = null;
    vm.timeWindowSeconds = 36 * 60 * 60; // two hours
    vm.selectedSchedule = null;
    vm.closestTimes = [];
    vm.refreshSchedule = refreshSchedule;
    vm.currentPosition = $geolocation.position;
    vm.selectNearest = true;

    activate();


    function activate() {
      prepareScheduleForDay();
      refreshSchedule();

      // TODO: destroy?
      $interval(prepareScheduleForDay, 60 * 60 * 1000);
      $interval(refreshSchedule, 5 * 1000);
      $interval(updateTimeToNearest, 1000);
    }

    var _geoLocationActivated = false;
    function setupGeoLocation() {
      if (_geoLocationActivated){
        return;
      }
      var geoOptions = {
        timeout: 60000,
        maximumAge: 1000,
        enableHighAccuracy: true
      };
      $geolocation.getCurrentPosition(geoOptions).then(refreshSchedule);
      $geolocation.watchPosition();
      _geoLocationActivated = true;
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

      if(vm.selectNearest){
        setupGeoLocation();
        sortNearestAndSelect();
      }

      for (var i = 0; i < vm.selectedSchedule.times.length; i++){
        var time = vm.selectedSchedule.times[i];
        var deltaNow = moment(time).diff(timeNow, 'seconds');
        if (deltaNow >= 0 && deltaNow < vm.timeWindowSeconds) {
          var deltaNext = moment(vm.selectedSchedule.times[i + 1]).diff(time, 'minutes');
          vm.closestTimes.push({at: time, nextAfterMinutes: deltaNext});
        }
      }
      updateTimeToNearest();
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

    function updateTimeToNearest(){
      if(vm.closestTimes.length) {
        var now = new Date();
        var delta = 0;
        for (var i = 0; i < vm.closestTimes.length; i++) {
          delta = moment(vm.closestTimes[i].at).diff(now, 'seconds');
          if (delta > 0){
            break;
          }
        }

        var virtualDate = new Date();
        virtualDate.setMinutes(0, delta, 0);
        vm.currentDelta = virtualDate;
      }
    }
  }
})();
