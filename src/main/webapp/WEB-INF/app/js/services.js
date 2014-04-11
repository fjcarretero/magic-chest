'use strict';

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
}]);