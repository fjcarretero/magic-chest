
/**
 * Module dependencies.
 */

var _ =  require('underscore'),
  express = require('express'),
  routes = require('./routes'),
  services = require('./routes/services'),
  upload = require('./routes/uploader/upload-formidable'),
  mongoose = require('mongoose'),
  models = require('./models'),
  passport = require('passport'),
  nconf = require('nconf'),
  fs = require('fs'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  FlickrStrategy = require('passport-flickr').Strategy,
  logger = require('./winston');

var app = module.exports = express();

//nconf.file({ file: 'settings.json' });

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
  logger.error('Error: ', err);
  res.render('error', { error: err });
}

//function redirectSec(req, res, next) {
//    if (req.headers['x-forwarded-proto'] == 'http' && ) {
//        res.redirect('https://' + req.headers.host + req.path);
//    } else {
//        return next();
//    }
//}

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
  app.configure('production', function(){
    app.use(function (req, res, next) {
      var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
//      console.log(schema)
      if (schema === 'https') {
        next();
      } else {
        res.redirect('https://' + req.headers.host + req.url);
      }
    });
  });
  app.use(app.router);
});

var mongo,
	  googleConfig,
    flickrConfig;

googleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
};
flickrConfig = {
  consumerKey: process.env.FLICKR_CONSUMER_KEY,
  consumerSecret: process.env.FLICKR_CONSUMER_SECRET,
  callbackURL: process.env.FLICKR_CALLBACK_URL,
  userAuthorizationURL: process.env.FLICKR_USER_AUTHORIZATION_URL,
  passReqToCallback: true
};

global.flickrOptions = {
  api_key: flickrConfig.consumerKey,
  secret: flickrConfig.consumerSecret,
};

app.configure('development', function(){
//  app.use(express.static(__dirname + '/src'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mongo = {
		"hostname":"localhost",
		"port":27017,
		"username":"",
		"password":"",
		"name":"",
		"db":"db3"
	};
  //  dropboxConfig = nconf.get("dropbox-settings");
});

app.configure('production', function(){
	app.use(express.errorHandler());
    app.use(function (req, res, next) {
      var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
//      console.log(schema)
      if (schema === 'https') {
        next();
      } else {
        res.redirect('https://' + req.headers.host + req.url);
      }
    });

	var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
	mongo = {
		"hostname": process.env[mongoServiceName + '_SERVICE_HOST'],
		"port": parseInt(process.env[mongoServiceName + '_SERVICE_PORT']),
		"username": process.env[mongoServiceName + '_USER'],
		"password": process.env[mongoServiceName + '_PASSWORD'],
		"db": process.env[mongoServiceName + '_DATABASE'],
	};
	//logger.info(mongo1);
	//mongo = env['mongodb-1.8'][0];
});

// Passport
// Google

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
          request.session.provider = 'google';

				  return done(null, user);
			  } else {
				  logger.error('User not found %s', user);
				  return done(null, false, { message: 'User not found' });
			  }
		  });
    });
  }
));

// Flickr

passport.use(new FlickrStrategy( flickrConfig,
  function(request, accessToken, accessTokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.

      logger.info(profile, accessToken, accessTokenSecret);
      logger.info('displayName=' + profile.displayName);
		  User.findOne({ email: profile.displayName }, function(err, user) {
			  if (err) { return done(err); }
			  if (user) {
				  user.name = profile.displayName;
				  //user.role = 'admin';
				  //console.log(profile);
          request.session.accessToken = {
            access_token: accessToken,
            access_token_secret: accessTokenSecret,
            user_id: profile.id
          };
          request.session.provider = 'flickr';

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
//  console.log('serializeUser') ;
//  console.log(user);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
//  console.log('deserializeUser')  ;
//  console.log(obj);
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

var hexKey = process.env.KEY;

global.key = new Buffer(hexKey, 'hex');
global.sizes = nconf.sizes;
_.each(global.sizes, function(size){
    size.size = 4 * size.width * size.height;
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		console.log('login2');
		return next();
	}
	console.log('not logged');
	if (req.xhr) {
		res.send(403, { error: 'Not authorized' });
	} else {
		if(!req.session.originalUrl){
            req.session.originalUrl = (req.url === '/'?'/index':req.url) ;
            logger.info("Original " + req.session.originalUrl);
        }
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
        return services.getKeys(req, res, next);
    } else {
        return next();
    }
}

function generateKey(req, res, next) {
    if (!req.session.permissionId){
        return services.generateKey(req, res, next);
    } else {
        return next();
    }
}

//app.get('/', ensureAuthenticated, routes.index);
//app.get('/admin', ensureAuthenticated, andRestrictTo('admin'), routes.baseAdmin);
app.get('/login', routes.login);
app.get('/index', ensureAuthenticated, routes.base);
app.get('/auth/google/request', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/drive']}));

app.get('/auth/google/callback',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/index');
	}
);

app.get('/auth/flickr/request', passport.authenticate('flickr'));

app.get('/auth/flickr/callback',
	passport.authenticate('flickr', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/index');
	}
);

app.get('/partials/:name', ensureAuthenticated, routes.partials);
//app.get('/admin/:name', ensureAuthenticated, andRestrictTo('admin'), routes.adminPages);

// JSON API

app.get('/api/files/list',       ensureAuthenticated, ensureKeys, generateKey, services.getFiles);
app.get('/api/files/download',   ensureAuthenticated, ensureKeys, generateKey, services.downloadFile);
app.post('/api/files/modify/:id',     ensureAuthenticated, ensureKeys, generateKey, services.setDateTaken);
app.post('/api/files/upload',    ensureAuthenticated, ensureKeys, generateKey, upload.uploadFile);
app.post('/api/files/delete',    ensureAuthenticated, ensureKeys, generateKey, services.deleteFile);
app.post('/api/files/share',     ensureAuthenticated, ensureKeys, generateKey, services.shareFile);
app.get('/api/files/:id/status',     ensureAuthenticated, ensureKeys, generateKey, services.getStatus);


//app.ws('/api/files/upload',    ensureAuthenticated, ensureKeys, generateKey, upload.uploadFile2);
//app.ws('/', function(ws, req) {
//  var id = setInterval(function() {
//    ws.send(JSON.stringify(new Date()), function() {  })
//  }, 1000);
////  console.log('socket', req);
//});


// redirect all others to the index (HTML5 history)
app.get('*', ensureAuthenticated, routes.base);

// Start server

app.listen(process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080, process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0', function(){
  logger.info("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
