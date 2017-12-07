var mongoose = require('mongoose'),
models = require('./models');

var usrs = process.argv.slice(2);

var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
mongo = {
    "hostname": process.env[mongoServiceName + '_SERVICE_HOST'],
    "port": parseInt(process.env[mongoServiceName + '_SERVICE_PORT']),
    "username": process.env[mongoServiceName + '_USER'],
    "password": process.env[mongoServiceName + '_PASSWORD'],
    "db": process.env[mongoServiceName + '_DATABASE'],
};

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
console.log(mongourl);
// Test

models.defineModels(mongoose, function() {
  User = mongoose.model('User');
  db = mongoose.connect(mongourl);
});

var user = null;
usrs.forEach(function (usr1){
    var usr = JSON.parse(usr1);
	user = new User;
	console.log('email ' + usr.email);
	console.log('role ' + usr.role);
	user.email = usr.email;
	user.role = usr.role;
	user.familyId = usr.familyId;
	user.save(function (error){
		if (error) {
			console.log('Error creating ' + error);
		} else {
            console.log('Done');
		}
		mongoose.disconnect();
	});
});