
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { email:req.user.email });
};

exports.baseAdmin = function(req, res){
  res.render('admin/base');
};

exports.base = function(req, res){
  res.render('base');
};

exports.login = function(req, res){
  res.render('login');
};

exports.admin = function(req, res){
  res.render('admin');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  console.log(name);
  res.render('partials/' + name);
};

exports.adminPages = function (req, res) {
  var name = req.params.name;
  res.render('admin/' + name);
};

exports.page = function (req, res) {
  var name = req.params.page;
  res.render('page/' + name);
};
