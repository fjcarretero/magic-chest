
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  gdrive = require('./routes/gdrive'),
  mongoose = require('mongoose'),
  models = require('./models'),
  passport = require('passport'),
  fs = require('fs'),
  nconf = require('nconf'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  logger = require('./winston');

var app = module.exports = express();

nconf.file({ file: 'google-settings.json' });

// Configuration

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  logger.error(err);
  res.render('error', { error: err });
}

app.configure( function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.json({strict: true}));
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(clientErrorHandler);
  app.use(errorHandler);
  app.use(app.router);
});

var mongo,
	googleConfig;

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mongo = {
		"hostname":"localhost",
		"port":27017,
		"username":"",
		"password":"",
		"name":"",
		"db":"db3"
	};
	googleConfig = nconf.get("settings");
});

app.configure('production', function(){
	app.use(express.errorHandler());
	//var env = JSON.parse(process.env.VCAP_SERVICES);
	//logger.info(env);
	//mongo = env['mongodb-1.8'][0]['credentials'];
	mongo = {
		"hostname": process.env.OPENSHIFT_MONGODB_DB_HOST,
		"port": parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT),
		"username": process.env.OPENSHIFT_MONGODB_DB_USERNAME,
		"password": process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
		"name": process.env.OPENSHIFT_APP_NAME,
		"db": process.env.OPENSHIFT_APP_NAME
	};
	//logger.info(mongo1);
	//mongo = env['mongodb-1.8'][0];
	googleConfig = nconf.get("settings");
});

// Passport

passport.use(new GoogleStrategy( googleConfig,
  function(request, accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.

      logger.info('email=' + profile.emails[0].value);
		User.findOne({ email: profile.emails[0].value }, function(err, user) {
			if (err) { return done(err); }
			if (user) {
				user.name = profile.displayName;
				//user.role = 'admin';
				//console.log(profile);
                request.session.accessToken = accessToken;

				return done(null, user);
			} else {
				logger.error('User not found %s', user);
				return done(null, false, { message: 'User not found' });
			}
		});
    });
  }
));

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Google profile is
// serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// MongoDB

var generate_mongo_url = function(obj){
	obj.hostname = (obj.hostname || 'localhost');
	obj.port = (obj.port || 27017);
	obj.db = (obj.db || 'test');
	if(obj.username && obj.password){
		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}else{
		return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
};

var mongourl = generate_mongo_url(mongo);
//var mongourl = mongo['url'];

models.defineModels(mongoose, function() {
  app.User = User = mongoose.model('User');
  db = mongoose.connect(mongourl);
});

var hexKey = fs.readFileSync('./key', 'utf8');
console.log(hexKey);
global.key = new Buffer(hexKey, 'hex');

// Routes
//
//User.collection.drop(function (err) {
//	if (err) {
//		console.log('Drop Users ' + err);
//	}
//});
//
//var usrs = [
//];
//var user = null;
//usrs.forEach(function (usr){
//	user = new User;
//	console.log('email ' + usr.email);
//	console.log('role ' + usr.role);
//	user.email = usr.email;
//	user.role = usr.role;
//	user.familyId = usr.familyId;
//	user.save(function (error){
//		if (error) {
//			console.log('Error creating ' + error);
//		}
//	});
//});
//Item.collection.drop(function (err) {
//	if (err) {
//		console.log('Drop List ' + err);
//	}
//});
//Item.collection.drop(function (err) {
//	if (err) {
//		console.log('Drop Item ' + err);
//	}
//});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		console.log('login2');
		return next();
	}
	console.log('not logged');
	if (req.xhr) {
		res.send(403, { error: 'Not authorized' });
	} else {
		logger.info(req.url);
		req.session.originalUrl = req.url;
		res.redirect('/login');
	}
}

function andRestrictTo(role) {
  return function(req, res, next) {
    req.user.role == role ? next() : next(new Error('Unauthorized'));
  }
}

function ensureKeys(req, res, next) {
    if (!req.session.keys){
        return gdrive.getKeys(req, res, next);
    } else {
        return next();
    }
}

function generateKey(req, res, next) {
    if (!req.session.permissionId){
        return gdrive.generateKey(req, res, next);
    } else {
        return next();
    }
}

//app.get('/', ensureAuthenticated, routes.index);
//app.get('/admin', ensureAuthenticated, andRestrictTo('admin'), routes.baseAdmin);
app.get('/login', routes.login);
app.get('/index', ensureAuthenticated, routes.index);
app.get('/auth/google/request', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/drive']}));

app.get('/auth/google/callback',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect(req.session.originalUrl ? req.session.originalUrl : '/index');
	}
);

app.get('/partials/:name', ensureAuthenticated, routes.partials);
//app.get('/admin/:name', ensureAuthenticated, andRestrictTo('admin'), routes.adminPages);

// JSON API

app.get('/api/files/google/list',       ensureAuthenticated, ensureKeys, generateKey, gdrive.getFiles);
app.get('/api/files/google/download',   ensureAuthenticated, ensureKeys, generateKey, gdrive.downloadFile);
app.post('/api/files/google/upload',    ensureAuthenticated, ensureKeys, generateKey, gdrive.uploadFile);
app.post('/api/files/google/delete',    ensureAuthenticated, ensureKeys, generateKey, gdrive.deleteFile);
app.post('/api/files/google/share',     ensureAuthenticated, ensureKeys, generateKey, gdrive.shareFile);

// redirect all others to the index (HTML5 history)
app.get('*', routes.login);

// Start server

app.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000, function(){
  logger.info("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
