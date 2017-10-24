require('controllers');
require('services');
require('directives');
require('css/app.css');


angular.module('magic-chest', ['magic-chest.controllers', 'magic-chest.services', 'magic-chest.directives', 'ngFileUpload', 'ngRoute', 'ngTouch', 'ui.bootstrap.modal', 'ui.bootstrap.dropdown']).
  config(['$httpProvider', '$compileProvider', function ($httpProvider, $compileProvider) {
//	$httpProvider.defaults.headers.common['Content-type'] = 'application/json;charset=UTF-8';
  var elementsList = $();

	var showMessage = function(content, cl, time) {
            $('<div/>')
                .addClass('message')
                .addClass(cl)
                .hide()
                .fadeIn('fast')
                .delay(time)
                .fadeOut('fast', function() { $(this).remove(); })
                .appendTo(elementsList)
                .text(content);

        };

//        $httpProvider.responseInterceptors.push(function($timeout, $q, $rootScope) {
      $httpProvider.interceptors.push(function($q, $rootScope) {
//            return function(promise) {
//                return promise.then(function(successResponse) {
//                    if (successResponse.config.method.toUpperCase() != 'GET')
//                        showMessage('Success', 'successMessage', 5000);
//                    return successResponse;
//
//                }, function(errorResponse) {
//                    switch (errorResponse.status) {
//                        case 401:
//                            showMessage('Wrong usename or password', 'errorMessage', 20000);
//                        	$rootScope.$broadcast('event:no-session', {});
//                        	break;
//                        case 403:
//                            showMessage('You don\'t have the right to do this', 'errorMessage', 20000);
//                            break;
//                        case 500:
//                            showMessage('Server internal error: ' + errorResponse.data.error, 'errorMessage', 20000);
//                            break;
//                        default:
//                            showMessage('Error ' + errorResponse.status + ': ' + errorResponse.data.error, 'errorMessage', 20000);
//                    }
//                    return $q.reject(errorResponse);
//                });
//            };
            return {
                'response': function(response){
                    if (response.config.method.toUpperCase() != 'GET')
                        showMessage('Success', 'successMessage', 5000);
                    return response;
                },
                'responseError': function(rejection) {
                     switch (rejection.status) {
                        case 401:
                            showMessage('Wrong usename or password', 'errorMessage', 20000);
                        	$rootScope.$broadcast('event:no-session', {});
                        	break;
                        case 403:
                            showMessage('You don\'t have the right to do this', 'errorMessage', 20000);
                            break;
                        case 500:
                            showMessage('Server internal error: ' + rejection.data.error, 'errorMessage', 20000);
                            break;
                        default:
                            showMessage('Error ' + rejection.status + ': ' + rejection.data.error, 'errorMessage', 20000);
                           break;
                    }
                    return $q.reject(rejection)
                }
            };
        });
        $compileProvider.directive('appMessages', function() {
            var directiveDefinitionObject = {
                link: function(scope, element, attrs) {
                  elementsList = element;
                }
            };
            return directiveDefinitionObject;
        });
  }]).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/list', {templateUrl: 'partials/index', controller: 'ListCtrl'});
    $routeProvider.when('/images', {templateUrl: 'partials/images', controller: 'ImagesCtrl', reloadOnSearch: false});
    $routeProvider.otherwise({redirectTo: '/list'});
  }]).
  config(['$locationProvider', function ($locationProvider) {
	   $locationProvider.html5Mode({enabled: true});
  }]);
