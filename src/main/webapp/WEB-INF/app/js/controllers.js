'use strict';

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
ListCtrl.$inject = ['$scope', '$log', '$window', 'MCServices'];