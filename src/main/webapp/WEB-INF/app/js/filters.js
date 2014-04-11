'use strict';

/* Filters */

angular.module('Catalog.filters', []).
  filter('interpolate', ['version', function(version) {
    return function (text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('status', function () {
	return function (input) {
		if (input === 'Approved') {
			return 'icon-ok';
		} else if (input === 'ABB') {
			return 'icon-star';
		} else if (input === 'Analysis Phase') {
			return 'icon-pencil';
		}
	};
});
