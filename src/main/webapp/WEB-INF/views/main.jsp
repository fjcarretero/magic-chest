<!doctype html>
<%@ page isELIgnored="false"%>
<html lang="en" ng-app="magic-chest">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=8" /> 
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Magic Chest</title>
		<!--[if lte IE 8]>
		<script>
			document.createElement('ng-include');
			document.createElement('ng-pluralize');
			document.createElement('ng-view');
			document.createElement('textile');
			 
			// Optionally these for CSS
			document.createElement('ng:include');
			document.createElement('ng:pluralize');
			document.createElement('ng:view');
		</script>
		<![endif]-->
		<link type="text/css" href="css/bootstrap.min.css" rel="stylesheet" />
		<link type="text/css" href="css/app.css" rel="stylesheet" />
		<link type="text/css" href="css/bootstrap-glyphicons.css" rel="stylesheet" />	
	</head>

	<body>
		<div class="container" ng-controller="ListCtrl">
			<div class="container navbar navbar-default">
				<div class="row">
					<div class="col-xs-2 col-sm-2 text-left"> 
					</div>
					<div class="col-xs-5 col-sm-5 text-center">
						<a class="navbar-brand" href="#">Magic Chest</a>
						<div class="btn-group">
  							<button type="button" class="btn btn-default navbar-btn dropdown-toggle" data-toggle="dropdown">
    							${ email } <span class="caret"></span>
  							</button>
  							<ul class="dropdown-menu" role="menu">
    							<li><a class="text-left" href="https://www.google.com/accounts/Logout">Logout</a></li>
							</ul>
						</div>
					</div>
					<div class="col-xs-5 col-sm-5 text-right" >
						<button type="button" class="btn btn-default navbar-btn glyphicon glyphicon-trash {{ isFileSelected() }}" ng-click="deleteFile()"></button>
						<div file-button class="btn">
							<button type="button" class="btn btn-default navbar-btn glyphicon glyphicon-circle-arrow-up"></button>
						</div>
						<div class="btn-group">
							<a class="btn btn-default navbar-btn dropdown-toggle glyphicon glyphicon-globe {{ isFileSelected() }}" data-toggle="dropdown">
								<span class="caret"></span>
							</a>
							<ul style="min-width: 70px;" class="dropdown-menu" role="menu">
	    						<li><a class="text-left" href="#shareModal" data-toggle='modal'>Share</a></li>
	    						<li><a class="text-left" href="#">Info</a></li>
							</ul>
						</div>
					</div>
				</div>
				<div class="row">
					<div class="messagesList" app-messages></div>
					<form role="form" name="form1" class="form-horizontal" ng-submit="submit()" enctype="multipart/form-data" novalidate>
						<div class="panel panel-default">
							<div class="panel-body">
								<!-- 
								<input type="file" ng-file-select="set($files)" id="file" name="file" />
								 -->
								<div ng-show="dropSupported" class="drop-box" ng-file-drop="set($files)" ng-file-drop-available="dropSupported=true">drop files in here</div>
								<div ng-show="!dropSupported">HTML5 Drop File is not supported on this browser</div>
								<div ng-show="uploadfile != null" class="progress progress-striped">
									<!-- 
									<div class="sel-file">
										<span class="progress1">						
											<div style="width:{{ progress }}%">{{ progress }}%</div>
										</span>
										{{uploadfile.name}} - size: {{uploadfile.size}}B
									</div>
									 -->
  									<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="{{ progress }}" aria-valuemin="0" aria-valuemax="100" style="width: {{ progress }}%;">
    									<span class="sr-only">{{ progress }}% Complete (success)</span>
  									</div>
								</div>
								<div class="response" ng-show="uploadResult.length > 0">
									Server Response:
									<ul>
										<li ng-bind-html-unsafe="result">{{result}}</li>
									</ul>
								</div>
							</div>
						</div>
						<!-- 
						<ul class="pager">
			  				<li><button type="submit" class="btn btn-default" >Submit</button></li>
						</ul>
						 -->
					</form>
				</div>
				<div class="row show-grid">
					<div class="col-xs-12">
						<div ng-show="loading">
							Loading ...
						</div>
						<ul id="listFiles" class="list-group">
							<li class="form-inline list-group-item" ng-repeat="file in files">
								<!-- 
								<div class="checkbox">
									<label>
										<input type="checkbox" name="checkbox-{{file.name}}" id="checkbox-{{file.name}}" ng-model="file.selected" />
									</label>
								</div>
								<a style="width: 98%; text-align: left;" class="btn {{ isButtonSelected(file) }}" ng-href="api/files/google/download?url={{file.downloadUrl }}&fileName={{file.cipheredName}}&permissionId={{file.permissionId}}">{{ file.name }}</a>
								 -->
								<div class="input-group">
									<span class="input-group-addon">
										<input type="checkbox" name="checkbox-{{file.name}}" id="checkbox-{{file.name}}" ng-model="file.selected" />
									</span>
									<a style="width: 98%; text-align: left;" class="form-control btn {{ isButtonSelected(file) }}" ng-href="api/files/google/download?url={{file.downloadUrl }}&fileName={{file.cipheredName}}&permissionId={{file.permissionId}}">{{ file.name }}</a>
								</div>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div id="shareModal" class="modal fade">
				<div class="modal-dialog">
					<form name="myForm" class="modal-content">
						<div class="modal-header">
							<button class="close" type='button' data-dismiss='modal' aria-hidden='true'>&times;</button>
							<h4 class="modal-title">Email</h4>
						</div>
						<div class="modal-body">
							<input name="email" type="email" class="form-control" ng-model='email' required/>
      						<span class="has-error" ng-show="myForm.email.$error.email">Not valid email!</span>
						</div>
						<div class="modal-footer">
							<a class="btn" href="#" data-dismiss='modal'>Cancel</a>
							<a class="btn btn-primary {{ hasErrors() }}" data-dismiss='modal' ng-click='shareFile()'>Share</a>
						</div>
					</form>
				</div>
			</div>
		</div>

		<script type="text/javascript" src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
		<script type="text/javascript" src="lib/angular/angular.min.js"></script>
		<script type="text/javascript" src="lib/bootstrap/bootstrap.min.js"></script>
		<script type="text/javascript" src="lib/underscore/underscore.min.js"></script>
		<script>
    		FileAPI = {
        		jsPath: "lib/angular-fileupload/FileAPI.min.js",
        		staticPath: "lib/angular-fileupload/FileAPI.flash.swf"
    		}
		</script>
		<script type="text/javascript" src="lib/angular-fileupload/angular-file-upload.min.js"></script>
		<%if (java.lang.System.getenv("NODE_ENV")!= null && java.lang.System.getenv("NODE_ENV").equals("production")) {%>
		<script type="text/javascript" src="js/magic-chest.min.js"></script>
		<%} else { %>
		<script type="text/javascript" src="js/app.js"></script>
		<script type="text/javascript" src="js/controllers.js"></script>
		<script type="text/javascript" src="js/services.js"></script>
		<script type="text/javascript" src="js/directives.js"></script>
		<%} %>
	</body>
</html>