(function() {
  'use strict';

  angular
    .module('schedully')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log, amMoment) {

    amMoment.changeLocale("ru");
    $log.debug('runBlock end');
  }

})();
