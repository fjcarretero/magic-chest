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
		        url: 'api/files/upload',
		        file: file
		      }).progress(function(evt) {
		    	  progressCallback(evt);
		      }).success(function(data, status, headers, config) {
		    	  $log.log('Uploaded! ' + data);
		    	  callback(data);
		      });
		},
		listFiles: function (filter, callback) {
			var url = '/api/files/list';
      if (filter) {
		    if (filter.to) {
			       url = url + '?from=' + filter.from + '&to=' + filter.to;
		    } else {
			       url = url + '?from=' + filter.from;
		    }
      }

      $http.get(url).
				then(function (data) {
					callback(data.data);
				});
		},
		downloadFile: function(name) {
			$http.get('api/files/download', {fileName: name}).
				then(function (data) {
					$log.log('Hi');
				});
		},
		deleteFile: function(id, callback) {
			$http.post('api/files/delete', id).
				then(function (data) {
					$log.log('Deleted! ' + data.data);
					callback(data.data);
				});
		},
		shareFile: function(id, callback) {
			$http.post('api/files/share', id).
				then(function (data) {
					$log.log('Shared! ' + data.data);
					callback();
				});
		},
		getState: function(filename, callback) {
			$http.get('api/files/' + filename +'/status').
			   then(function (data) {
           $log.log('Hi');
           callback(data.data);
			    }
      );
		},
    modifyDate: function(id, date, callback) {
      $http.post('api/files/modify/' + id, date).
        then(function (data) {
          $log.log('Modified!');
				  callback(data.data);
			  }
      );
    }
	};
}]);
