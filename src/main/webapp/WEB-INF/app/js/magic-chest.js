'use strict';

angular.module('magic-chest', ['magic-chest.services', 'magic-chest.directives', 'angularFileUpload']).
config(['$httpProvider', '$compileProvider', function ($httpProvider, $compileProvider) {
//	$httpProvider.defaults.headers.common['Content-type'] = 'application/json;charset=UTF-8';
	var elementsList = jQuery();
	
	var showMessage = function(content, cl, time) {
            jQuery('<div/>')
                .addClass('message')
                .addClass(cl)
                .hide()
                .fadeIn('fast')
                .delay(time)
                .fadeOut('fast', function() { jQuery(this).remove(); })
                .appendTo(elementsList)
                .text(content);
			
        };
        $httpProvider.responseInterceptors.push(function($timeout, $q, $rootScope) {
            return function(promise) {
                return promise.then(function(successResponse) {
                    if (successResponse.config.method.toUpperCase() != 'GET')
                        showMessage('Success', 'successMessage', 5000);
                    return successResponse;

                }, function(errorResponse) {
                    switch (errorResponse.status) {
                        case 401:
                            showMessage('Wrong usename or password', 'errorMessage', 20000);
                        	$rootScope.$broadcast('event:no-session', {});
                        	break;
                        case 403:
                            showMessage('You don\'t have the right to do this', 'errorMessage', 20000);
                            break;
                        case 500:
                            showMessage('Server internal error: ' + errorResponse.data.error, 'errorMessage', 20000);
                            break;
                        default:
                            showMessage('Error ' + errorResponse.status + ': ' + errorResponse.data.error, 'errorMessage', 20000);
                    }
                    return $q.reject(errorResponse);
                });
            };
        });
        $compileProvider.directive('appMessages', function() {
            var directiveDefinitionObject = {
                link: function(scope, element, attrs) { elementsList.push(jQuery(element)); }
            };
            return directiveDefinitionObject;
        });
  }]);'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('magic-chest.services', []).
  value('localStorage', window.localStorage).
  factory('MCServices', ['$log', '$http', function($log, $http) {
	return {
		uploadFile: function(file, progressCallback, callback) {
			$http.uploadFile({
		        url: 'api/files/google/upload',
		        file: file
		      }).progress(function(evt) {
		    	  progressCallback(evt);
		      }).success(function(data, status, headers, config) {
		    	  $log.log('Uploaded! ' + data);  
		    	  callback(data);
		      }); 
		},
		listFiles: function (callback) {
			$http.get('api/files/google/list').
				success(function (data) {
					callback(data);
				});
		},
		downloadFile: function(name) {
			$http.get('api/files/google/download', {fileName: name}).
				success(function (data) {
					$log.log('Hi');
				});
		},
		deleteFile: function(id, callback) {
			$http.post('api/files/google/delete', id).
				success(function (data) {
					$log.log('Deleted! ' + data);
					callback(data);
				});
		},
		shareFile: function(id, callback) {
			$http.post('api/files/google/share', id).
				success(function (data) {
					$log.log('Shared! ' + data);
					callback();
				});
		},
		getState: function(callback) {
			$http.get('api/files/google/status').
			success(function (data) {
				$log.log('Hi');
				callback(data);
			});
		}
	};
}]);'use strict';

/* Controllers */

function ListCtrl($scope, $log, $window, MCServices) {
	$scope.files = [];
	$scope.loading = true;
	//$scope.progress = 0;
	
	$scope.set = function($files){
		$scope.uploadfile = $files[0];
		$scope.submit();
	};
	
	$scope.isFileSelected = function(){
		return _.some($scope.files, function(file) {
			return file.selected;
		})?"":"disabled";
	};
	
	$scope.isButtonSelected = function(file){
		return file.selected?"btn-primary":"btn-default";
	};
	
	$scope.submit = function(){
		MCServices.uploadFile($scope.uploadfile, function(evt) {
			$scope.progress = parseInt(10.0 * evt.loaded / evt.total);
			if (!$scope.$$phase) {
				$scope.$apply();
			}

		}, function (data) {
			
			$scope.files.push(data);
			$scope.$apply();
			$scope.setTimer({});
		});
	};
	
	$scope.setTimer = function(state) {
		setTimeout(function(state){
			MCServices.getState(function(data){
				state = data;
				$scope.progress = parseFloat(data.progress) * 90 + 10;
				$log.log($scope.progress);
				if (state.state!=='MEDIA_COMPLETE') {
					$scope.setTimer(data);
				} else {
					delete $scope.uploadfile;
				}
			});
		}, 5000);
	}
	
	$scope.init = function () {
		$scope.progress = 0;
		delete $scope.file;
		MCServices.listFiles(function (files) {
			$scope.files = files;
			$scope.loading = false;
		});
	};
	
	$scope.downloadFile = function(name){
		MCServices.downloadFile(name);
	};
	
	$scope.deleteFile = function(name){
		var files2delete = [];
		_.each($scope.files, function(file){
			if(file.selected){
				files2delete.push(file.id);
			}
		});
		MCServices.deleteFile(files2delete, function(data) {
			$scope.files = _.reject($scope.files, function(file){
				return _.some(data, function(id){
					return id === file.id;
				});
			})
		});
	};
	
	$scope.shareFile = function(name){
		var files2delete = [];
		_.each($scope.files, function(file){
			if(file.selected){
				files2delete.push(file.id);
			}
		});
		MCServices.shareFile({fileId: files2delete, email: $scope.email}, function() {
			$scope.init();
		});
	};
	
	$scope.hasErrors = function(){
		return ($scope.myForm.email.$error.required || $scope.myForm.email.$error.email)?"disabled":"";
	};
	
	$scope.init();
	
	$scope.$on('event:no-session', function(e, data) {
		$log.log('kkota');
		$window.location = 'login';
	});
}
ListCtrl.$inject = ['$scope', '$log', '$window', 'MCServices'];'use strict';

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
			  var fileInput = angular.element('<input type="file" ng-file-select="set($files)"/>');
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
	})
  ;
