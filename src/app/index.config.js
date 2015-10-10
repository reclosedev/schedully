(function() {
  'use strict';

  angular
    .module('schedully')
    .config(config);

  /** @ngInject */
  function config($logProvider) {

    $logProvider.debugEnabled(true);

  }

})();
