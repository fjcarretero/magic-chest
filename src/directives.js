'use strict';

/* Directives */


angular.module('magic-chest.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('fileButton', function() {
	  return {
		  compile: function (element, attrs) {
			  var fileInput = angular.element('<input type="file" nv-file-select uploader="uploader" multiple/>');
			  fileInput.css({
		        position: 'absolute',
		        top: 0,
		        left: 0,
		        'z-index': '2',
		        width: '100%',
		        height: '100%',
		        opacity: '0',
		        cursor: 'pointer'
		      })

	      var el = angular.element(element)
	      var button = el.children()[0]

	      el.css({
	        position: 'relative',
	        overflow: 'hidden'/*,
	        width: button.offsetWidth,
	        height: button.offsetHeight*/
	      })

	      el.append(fileInput)

	    }
	  }
  }).
  directive('sbLoad', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        var fn = $parse(attrs.sbLoad);
        elem.on('load', function (event) {
          scope.$apply(function() {
            fn(scope, { $event: event });
          });
        });
      }
    };
  }])
  ;
