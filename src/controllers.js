'use strict';

/* Controllers */
angular.module('magic-chest.controllers', []).
controller('ListCtrl',['$scope', '$log', '$window', '$timeout','$uibModal', 'Upload', 'MCServices',
function ($scope, $log, $window, $timeout, $uibModal, Upload, MCServices) {
//function ListCtrl($scope, $log, $window, FileUploader, MCServices) {
//	var host = location.origin.replace(/^http/, 'ws')
    $scope.files = [];
	  $scope.loading = true;
    $scope.uploadfile = {};

//     $scope.uploader.onAfterAddingAll = function(addedFileItems) {
//         $log.info('onAfterAddingAll', addedFileItems);
// //        var host = location.origin.replace(/^http/, 'ws')
// //        var ws = new WebSocket(host);
// //        ws.onmessage = function (msg) {
// //            $log.log(msg);
// //        };
//         _.each(addedFileItems, function (addedFileItem){
//             $log.log(addedFileItem.file.name);
//             $scope.uploadfile[addedFileItem.file.name] = true;
//             $scope.files.unshift({name: addedFileItem.file.name});
//             $scope.setTimer(addedFileItem.file.name, function(data){
//                $log.log("Finish");
//             });
//         });
//     };
//
//     $scope.uploader.onSuccessItem = function(fileItem, response, status, headers) {
//         $log.info('onSuccessItem', fileItem, response, status, headers);
// //        $scope.files.unshift(response);
//         _.each($scope.files, function(file){
//             if(file.name === fileItem.file.name){
//                 angular.copy(response, file);
//             }
//         });
//
//     };

    // $scope.uploader.onProgressItem = function(fileItem, progress) {
    //     $log.info('onProgressItem', fileItem, progress);
    // };

  $scope.dropSupported = true;
    //$scope.progress = 0;

  $scope.uploadFiles = function(files) {
    _.each(files, function(file){
      $log.log(file.name);
      file.upload = Upload.upload({
        url: 'api/files/upload',
        data: {
          file: file
        }
      });
      file.upload.then(function(response){
        $timeout(function(){
          _.each($scope.files, function(file){
            if(file.name === response.data.name){
              angular.copy(response.data, file);
            }
          });
        })
      });
      $scope.uploadfile[file.name] = true;
      $scope.files.unshift({name: file.name});
      $scope.setTimer(file.name, function(data){
        $log.log("Finish");
      });
    });
  };

	$scope.set = function($files){
		$scope.uploadfile = $files;
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

	// $scope.submit = function(){
	// 	MCServices.uploadFile($scope.uploadfile, function(evt) {
	// 		$scope.progress = parseInt(10.0 * evt.loaded / evt.total);
	// 		if (!$scope.$$phase) {
	// 			$scope.$apply();
	// 		}
  //
	// 	}, function (data) {
  //
	// 		$scope.files.unshift(data);
	// 		$scope.$apply();
	// 		$scope.setTimer({});
	// 	});
	// };

	$scope.setTimer = function(file, cb) {
		setTimeout(function(file, cb){
            $log.log(file);
			MCServices.getState(file, function(data){
				//state = data;
				$scope.progress[file] = parseFloat(data.progress) * 90 + 10;
				$log.log($scope.progress[file]);
				if (data.state!=='MEDIA_COMPLETE') {
					$scope.setTimer(file, cb);
				} else {
					delete $scope.uploadfile[file];
                    cb(data);
				}
			});
		}, 1000, file, cb);
	}

	$scope.init = function () {
		$scope.progress = {};
		delete $scope.file;
		MCServices.listFiles(null, function (files) {
			$scope.files = files;
			$scope.loading = false;
		});
	};

	$scope.downloadFile = function(name){
		MCServices.downloadFile(name);
	};

	var deleteFile = function(name){

		var files2delete = [];
		_.each($scope.files, function(file){
			if(file.selected){
				files2delete.push(file.id);
			}
		});
//        console.log("delete " + files2delete);
		MCServices.deleteFile(files2delete, function(data) {
			$scope.files = _.reject($scope.files, function(file){
				return _.some(data, function(id){
					return id === file.id;
				});
			})
		});
	};

    $scope.openDelete = function (size) {

        var modalInstance = $uibModal.open({
          animation: false,
          windowTemplateUrl: 'partials/window-delete-modal',
          templateUrl: 'partials/delete-modal',
          controller: 'DeleteModalCtrl',
          backdrop: false,
          size: size,
          resolve: {
            imagesName: function () {
                var files2delete = [];
                _.each($scope.files, function(file){
                    if(file.selected){
                        files2delete.push(file.name);
                    }
                });

                return files2delete.toString();
            }
          }
        });

        modalInstance.result.then(function () {
          deleteFile();
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
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
}]).
//ListCtrl.$inject = ['$scope', '$log', '$window', 'FileUploader', 'MCServices'];

controller('ImagesCtrl', ['$scope', '$location', '$route', '$uibModal', '$log', 'MCServices',
function ($scope, $location, $route, $uibModal, $log, MCServices) {
//function ImagesCtrl($scope, $log, MCServices) {
    $scope.files = [];
    $scope.dateList = [];
	  $scope.loading = true;
    $scope.currentImage = {};
    $scope.previousImage = {};
    $scope.nextImage = {};
    $scope.currentImageIndex = 0;
    $scope.counter = '0/0';
    $scope.loadingImg = true;
    $scope.menuOpen = false;

    var m1 = moment(),
        m2 = moment().subtract(m1.date()-1, 'd'),
        t;

//    console.log(m1.format('YYYY-MM-DD'));
   $scope.dateList.push({filter: {from: m2.format('YYYY-MM-DD')}, text: m2.format('MM/YYYY')});
	 do {
        t = angular.copy(m2);
        m2 = angular.copy(m2.subtract(1, 'M'));
        m1 = angular.copy(t);
	      $scope.dateList.push({filter: {from: m2.format('YYYY-MM-DD'), to: m1.format('YYYY-MM-DD')}, text: m2.format('MM/YYYY')});
    } while (m2 > moment('2000-01-01'))
//    console.log($scope.dateList);
    if ($location.search() && $location.search().from){
      $log.log(moment($location.search().from, 'YYYY-MM-DD').format('MM/YYYY'));
      $scope.filterDate = {filter: {from: $location.search().from}, text: moment($location.search().from, 'YYYY-MM-DD').format('MM/YYYY')};
      if ($location.search().to){
        $scope.filterDate.filter.to = $location.search().to;
      }
    } else {
      $scope.filterDate = $scope.dateList[0];
    }

    var init = function () {
		    $log.log($scope.loadingImg);
        $scope.progress = {};
        $scope.currentImageIndex = ($location.search() && $location.search().id)?parseInt($location.search().id):0;
		    delete $scope.file;
		    MCServices.listFiles($scope.filterDate.filter, function (files) {
//			console.log(files.length);
            $scope.files = files;
			      $scope.loading = false;
            move();
		});
	};

    var move = function(){
        $scope.loadingImg = true;
        $scope.currentImage = $scope.files[$scope.currentImageIndex];
        $scope.previousImage = $scope.currentImageIndex>0 ? $scope.files[$scope.currentImageIndex - 1] : {};
        $scope.nextImage = $scope.currentImageIndex<$scope.files.length ? $scope.files[$scope.currentImageIndex + 1] : {};
        $scope.counter = ($scope.currentImageIndex+1) + '/' + $scope.files.length;
    };

    $scope.getCurrentImageSrc = function(){
        $log.log('Loading current image');
        return getImageSrc($scope.currentImage);
	};

    $scope.getPreviousImageSrc = function(){
        $log.log('Loading previous image');
        return getImageSrc($scope.previousImage);
	};

    $scope.getNextImageSrc = function(){
        $log.log('Loading next image');
        return getImageSrc($scope.nextImage);
	};

    var getImageSrc = function(image){
//        console.log('getImageSrc');
        if(image && image.downloadUrl) {
            return 'api/files/download?url=' + image.downloadUrl + '&fileName=' + image.cipheredName + '&permissionId=' + image.permissionId;
        }
        return '';
	};

    $scope.nextSlide = function () {
        $location.search('id', $scope.currentImageIndex<$scope.files.length-1?$scope.currentImageIndex+1:$scope.currentImageIndex);
//        console.log('kkota');
//        if($scope.currentImageIndex < $scope.files.length-1) {
//            $scope.loadingImg = true;
//            $scope.currentImageIndex++;
//            move();
//        }
    };

    $scope.prevSlide = function () {
        $location.search('id', $scope.currentImageIndex>0?$scope.currentImageIndex-1:0);
//        console.log('kkota1');
//        if($scope.currentImageIndex > 0) {
//            $scope.loadingImg = true;
//            $scope.currentImageIndex--;
//            move();
//        }
    };

    $scope.onlola = function (){
//        $log.log("Me cargo en to!");
        $scope.loadingImg = false;
    };

   	var modifyDate = function(dateTaken){
		    var dat = moment(dateTaken).format('YYYY-MM-DD');
        $log.log(dat);
        MCServices.modifyDate($scope.files[$scope.currentImageIndex].id, {dateTaken: dat}, function() {
			    $scope.loadingImg = true;
          init();
		    });
	};

    var deletePhoto = function(){
      MCServices.deleteFile([$scope.files[$scope.currentImageIndex].id], function() {
			$scope.loadingImg = true;
      init();
		});
	};

    $scope.openEdit = function (size) {
        var modalInstance = $uibModal.open({
          animation: false,
          windowTemplateUrl: 'partials/window-delete-modal',
          templateUrl: 'partials/date-modal',
          controller: 'ModalDateCtrl',
          backdrop: false,
          size: size,
          resolve: {
            dateTaken: function () {
                return $scope.dateTaken;
            }
          }
        });

        modalInstance.result.then(function (dateTaken) {
          $scope.dateTaken = dateTaken;
          modifyDate(dateTaken);
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openDelete = function (size) {
        var modalInstance = $uibModal.open({
          animation: false,
          templateUrl: 'partials/delete-modal',
          controller: 'DeleteModalCtrl',
          size: size,
          resolve: {
            imagesName: function () {
                return $scope.currentImage.name;
            }
          }
        });

        modalInstance.result.then(function () {
          deletePhoto();
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.hasErrors = function(){
		return ($scope.myForm.dateTaken.$error.required || $scope.myForm.dateTaken.$error.dateTaken)?"disabled":"";
	};

    $scope.openMenu = function(){
        $scope.menuOpen = true;
    }

    $scope.isMenuOpen = function() {
        return ($scope.menuOpen?"open":"");
    }

    $scope.$watch('filterDate', function(newValue){
      if(newValue && newValue.filter){
        $location.search('from', newValue.filter.from);
        if (newValue.filter.to){
          $location.search('to', newValue.filter.to);
        }
//		console.log('watch');
        init();
      }
	});

    $scope.$on('$routeUpdate', function() {
        $log.log($location.search());
        $scope.currentImageIndex = parseInt($location.search().id);
        move();
    });

//    init();
}]).

controller('ModalDateCtrl', ['$scope', '$uibModalInstance', 'dateTaken',
function ($scope, $uibModalInstance, dateTaken) {
  $scope.dateTaken = dateTaken;

  $scope.modifyDate = function () {
    $uibModalInstance.close($scope.dateTaken);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}]).

controller('DeleteModalCtrl', ['$scope', '$uibModalInstance', 'imagesName',
function ($scope, $uibModalInstance, imagesName) {
  $scope.imagesName = imagesName;

  $scope.deletePhoto = function () {
    $uibModalInstance.close();
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}]);
