(function() {
  'use strict';

  angular
    .module('schedully')
    .run(runBlock)
    .filter("secondsToDateTime", function(){return secondsToDateTime});

  /** @ngInject */
  function runBlock($log, amMoment) {

    amMoment.changeLocale("ru");
    $log.debug('runBlock end');
  }

  function secondsToDateTime(seconds) {
      return new Date(1970, 0, 1).setSeconds(seconds);
  }

})();
