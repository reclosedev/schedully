(function() {
  'use strict';

  angular
    .module('schedully')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($interval, $geolocation, $log, $localStorage) {
    var vm = this;

    var _debug = false;

    vm.refreshSchedule = refreshSchedule;

    vm.appDB = null;
    vm.closestTimes = [];
    vm.availableSchedules = [];
    vm.locationsById = {};

    vm.currentPosition = $geolocation.position;
    vm.distance = null;
    vm.approximateETA = null;

    vm.$storage = $localStorage.$default({
      useGeoLocation: false,
      showAllSchedules: false,
      locationIdTo: null,
      locationIdFrom: null
    });
    
    var schedulesByLocations = {};


    activate();

    function activate() {
      initializeLocationsAndSchedules();
      refreshSchedule();

      // TODO: destroy?
      $interval(initializeLocationsAndSchedules, 60 * 60 * 1000);
      $interval(refreshSchedule, 5 * 1000);
      $interval(updateTimeAndDistanceToNearest, 500);
    }

    function initializeLocationsAndSchedules() {
      $log.info("Prepare data for new day");

      vm.appDB = _.cloneDeep(window.APP_DB);

      vm.locationsById = {};
      schedulesByLocations = {};

      angular.forEach(vm.appDB.locations, function (location) {
        vm.locationsById[location.id] = location;
      });

      angular.forEach(vm.appDB.locations, function (location) {
        angular.forEach(location.schedules, function (schedule) {
          if (!(location.id in schedulesByLocations)){
            schedulesByLocations[location.id] = {}
          }
          schedulesByLocations[location.id][schedule.to] = schedule;

          for (var i = 0; i < schedule.times.length; i++) {
            var date = createDate();
            date.setHours(schedule.times[i][0], schedule.times[i][1], 0, 0);
            if (schedule.times[i][0] == 0) {
              date.setDate(date.getDate() + 1);
            }
            schedule.times[i] = date;
          }
        });
      });
      if (!vm.$storage.locationIdFrom || !(vm.$storage.locationIdFrom in vm.locationsById)){
        vm.$storage.locationIdFrom = vm.appDB.locations[0].id;
      }
      vm.availableSchedules = vm.locationsById[vm.$storage.locationIdFrom].schedules;
    }

    function refreshSchedule() {
      if (_debug){
        vm.currentPosition = {
          coords: {latitude: 56.321376, longitude: 43.955503, speed: 2}
        }
      }

      ensureGeoLocationState();
      if(vm.$storage.useGeoLocation){
        sortLocationsByDistanceAndSelectNearest();
      }

      vm.availableSchedules = vm.locationsById[vm.$storage.locationIdFrom].schedules;
      if (_.findIndex(vm.availableSchedules, 'to', vm.$storage.locationIdTo) === -1) {
        vm.$storage.locationIdTo = vm.availableSchedules[0].to;
      }

      vm.closestTimes = [];
      var timeNow = createDate();
      var schedule = selectedSchedule();
      var timeOffset = vm.locationsById[vm.$storage.locationIdFrom].places[0].time_offset || 0;

      for (var i = 0; i < schedule.times.length; i++){
        var time = schedule.times[i];
        var deltaNow = moment(time).diff(timeNow, 'seconds') + timeOffset;

        if (vm.$storage.showAllSchedules || deltaNow >= 0) {
          var deltaNext = moment(schedule.times[i + 1]).diff(time, 'minutes');
          if (deltaNext < 0) {
            deltaNext = "n/a";
          }
          vm.closestTimes.push({at: time, nextAfterMinutes: deltaNext});
        }
      }
      updateTimeAndDistanceToNearest();
    }

    function sortLocationsByDistanceAndSelectNearest() {
      if (vm.currentPosition && vm.currentPosition.coords) {
        vm.appDB.locations = _.sortBy(vm.appDB.locations, function (location) {

          location.places = _.sortBy(location.places, function (place) {
            var dist = haversine(vm.currentPosition.coords, place.location);
            place.distance = dist;
            return dist
          });
          return location.places[0].distance;
        });
        vm.$storage.locationIdFrom = vm.appDB.locations[0].id;
      }
    }

    function updateTimeAndDistanceToNearest(){
      if(!vm.closestTimes.length) {
        return
      }
      var now = createDate();
      var delta = 0;
      for (var i = 0; i < vm.closestTimes.length; i++) {
        delta = moment(vm.closestTimes[i].at).diff(now, 'seconds');
        if (delta > 0){
          vm.closestTimes[i].isTracked = true;
          break;
        }
      }
      var virtualDate = createDate();
      virtualDate.setHours(0, 0, delta, 0);
      vm.timeToClosest = virtualDate;

      var distance = vm.locationsById[vm.$storage.locationIdFrom].places[0].distance;
      if (typeof distance != "undefined"){
        vm.distance = (distance * 1000).toFixed(2);
      }

      if (vm.distance && delta && vm.currentPosition) {
        var speed = 1.38889; // 5 km/h in m/s
        if (vm.currentPosition.coords && vm.currentPosition.coords.speed){
          speed = vm.currentPosition.coords.speed;
        }
        var approximateArrivalSeconds = vm.distance / speed;
        vm.approximateETA = createDate().setHours(0, 0, approximateArrivalSeconds, 0);
      }
    }

    function selectedSchedule(){
      return schedulesByLocations[vm.$storage.locationIdFrom][vm.$storage.locationIdTo];
    }

    function createDate(){
      if (_debug){
        var date = new Date();
        date.setHours(9, 30);
        return date;
      }
      return new Date();
    }

    var _geoLocationActivated = false;

    function ensureGeoLocationState() {
      if (_geoLocationActivated){
        if (!vm.$storage.useGeoLocation){
          _geoLocationActivated = false;
          $geolocation.clearWatch();
        }
      } else if (vm.$storage.useGeoLocation) {
        var geoOptions = {
          timeout: 60000,
          maximumAge: 1000,
          enableHighAccuracy: true
        };
        $geolocation.getCurrentPosition(geoOptions).then(refreshSchedule);
        $geolocation.watchPosition();
        _geoLocationActivated = true;
      }
    }
  }
})();
