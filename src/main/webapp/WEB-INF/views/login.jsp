<!doctype html>
<html>
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=8" /> 
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Magic Chest</title>

		<link type="text/css" href="css/bootstrap.min.css" rel="stylesheet">
		<link type="text/css" href="css/app.css" rel="stylesheet">	
		<link type="text/css" href="css/bootstrap-glyphicons.css" rel="stylesheet">	
	</head>
	<body>
		<div class="container">
			<div class="container navbar navbar-default">
				<div class="row">
					<div class="col-xs-2 col-sm-2 text-left"></div>
					<div class="col-xs-7 col-sm-8 text-center">
						<a class="navbar-brand" href="#">Magic Chest</a>
					</div>
					<div class="col-xs-3 col-sm-2 text-right" ></div>
				</div>
				<div class="jumbotron">
					<h1>Magic Chest</h1>
					<form action="auth/google/request" method="get" data-ajax="false">
						<button type="submit" class="btn btn-large btn-primary">Login</button>
					</form>
				</div>
			</div>
		</div>		
	</body>
</html>