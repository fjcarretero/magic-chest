/*
 * Serve JSON to our AngularJS client
 */
var _ = require('underscore'),
	logger = require('../winston'),
    q = require('q'),
    formidable = require("formidable"),
    request = require('superagent'),
    crypto = require('./utilsCrypto'),
    crypto2 = require('crypto');


exports.getKeys = function (req, res, next) {
	logger.info('Get Keys');
    var queue = [];
    req.session.keys = {};

    request
        .get('https://www.googleapis.com/drive/v2/files')
        .type('application/json')
        .query({q: "title = 'magic-chest' and mimeType='application/vnd.rig.cryptonote'"})
        .set('Authorization', 'Bearer ' + req.session.accessToken)
        .end(function(err, resp){
            if (err) {
                return next(err);
            } else {
                var response = resp.body;
                req.session.key = {};
                //req.session.decryptors = {};
                _.each(response.items, function(item){
    //                console.log(item);
                    if(item.owners[0].displayName === req.user.name){
                        console.log('pp');
                        req.session.permissionId = item.owners[0].permissionId;
                        req.session.keyFileId = item.id;
                    }
                    queue.push(q.nfcall(retrieveStoreKeys, req.session, item));
                });
                q.all(queue)
                .then(function(ful) {
                    console.log('ful');
                }, function(rej) {
                    console.log('rej ' + rej);
                })
                .fail(function(err) {
                    console.log('err');
                    return next(err);
                })
                .fin(function() {
                    console.log('fin');
                    console.log(req.session.keys);
                    return next();
                });
            }
        });

};

exports.generateKey = function (req, res, next) {

    crypto2.randomBytes(128), function(ex, buf) {
        if(ex){
            return next(ex);
        } else {

            request
                .post('https://www.googleapis.com/upload/drive/v2/files')
                .type('application/vnd.rig.cryptonote')
                .query({uploadType: "media"})
                .set('Authorization', 'Bearer ' + req.session.accessToken)
                .write(crypto.encrypt(buf, global.key.toString('binary')).toString('hex'))
                .end(function(err, res){
                    if(err){
                        return next(err);
                    } else {
                        request
                            .put('https://www.googleapis.com/drive/v2/files/' + res.body.id)
                            .type('application/json')
                            .set('Authorization', 'Bearer ' + req.session.accessToken)
                            .send({title: 'magic-chest'})
                            .end(function(er, re){
                                if(er){
                                    return next(er);
                                } else {
                                    req.session.permissionId = res.body.owners[0].permissionId;
                                    req.session.keyFileId = res.body.id;
                                    req.session.keys[req.session.permissionId] = buf;

                                    return next();
                                }
                            });
                    }
                });
        }
    });
};

exports.getFiles = function (req, res, next) {
	logger.info('Get Files');
    var r = [],
        queue = [];

    request
        .get('https://www.googleapis.com/drive/v2/files')
        .type('GET', 'application/json')
        .query({q: "title != 'magic-chest' and mimeType='application/vnd.rig.cryptonote'"})
        .set('Authorization', 'Bearer ' + req.session.accessToken)
        .end(function(err, resp){
            if (err){
                return next(err);
            } else {
                var response = resp.body;
                _.each(response.items, function(item){
                    queue.push(q.nfcall(mapFile, item, req.session.keys[item.owners[0].permissionId]));
                });
                q.all(queue)
                    .then(function(ful) {
                       res.json(
                          ful
                       );
                    }, function(rej) {
                        // SEND AND ERRO
                        console.log(rej);
                    })
                    .fail(function(err) {
                        //
                        return next(err);
                    })
                    .fin(function() {
                        //
                    });
            }
        });
};

exports.downloadFile = function (req, res, next) {
	logger.info('download File');
    var sKey = req.session.keys[req.query.permissionId];

    var tt = crypto.decrypt(new Buffer(req.query.fileName, 'hex'), sKey).split('|');

    var mimetype = tt[1];
    if (!mimetype) {
	   mimetype = "application/octet-stream";
	}
    res.header('Content-Type', mimetype);
    res.header('Content-Disposition', 'attachment; filename="' + tt[0] + '"');
    var decipher = crypto2.createDecipheriv('aes-128-cbc', sKey, '8888888888888888');

    var dat;

    var r = request
        .get(req.query.url)
        .type('application/octet-stream')
        .set('Authorization', 'Bearer ' + req.session.accessToken);

    r.pipe(decipher).pipe(res);
};

exports.uploadFile = function (req, res, next) {
	logger.info('upload File');

    var sKey = req.session.keys[req.session.permissionId];
    var cipher = crypto2.createCipheriv('aes-128-cbc', sKey, '8888888888888888');
    var form = new formidable.IncomingForm();
    var encName;

    var req1 = request
        .post('https://www.googleapis.com/upload/drive/v2/files')
        .type('application/vnd.rig.cryptonote')
        .query({uploadType: "media"})
        .set('Authorization', 'Bearer ' + req.session.accessToken);

    form.onPart = function (part) {
        if (!part.filename) {
            // let formidable handle all non-file parts
            form.handlePart(part);
            return;
        }

        var tt = [];
        tt.push(part.filename);
        tt.push(part.mime);

        encName = crypto.encrypt(tt.join('|'), sKey).toString('hex');

        part.on('data', function(data){
            req1.write(cipher.update(data, 'binary', 'binary'), 'binary');
        });

        part.on('end', function(){
            req1.write(cipher.final('binary'), 'binary');
            req1.end(function(resp){
                request
                    .put('https://www.googleapis.com/drive/v2/files/' + resp.body.id)
                    .type('application/json')
                    .set('Authorization', 'Bearer ' + req.session.accessToken)
                    .send({title: encName})
                    .end(function(er, re){
                        if(er){
                            return next(er);
                        } else {
                            var item = re.body;
                            res.json({
                                name: part.filename,
                                type: 'file',
                                documentType: part.mime,
                                cipheredName: item.title,
                                downloadUrl: encodeURIComponent(item.downloadUrl),
                                id: item.id,
                                permissionId: item.owners[0].permissionId,
                                owners: item.owners
                            });
                        }
                    });
            });
        });

        part.on('error', function(err){
            return next(err);
        });
    }

    form.parse(req);
};

exports.deleteFile = function (req, res, next) {
    var queue = [];

    _.each(req.body, function(id){
        queue.push(q.nfcall(delFile, id, req.session.accessToken));
    });
    q.all(queue)
    .then(function(ful) {
        //
    }, function(rej) {
        //
    })
    .fail(function(err) {
        return next(err);
    })
    .fin(function() {
        res.json(req.body)
    });

};

exports.shareFile = function (req, res, next) {
    var queue = [];

    shrKey(req.session.keyFileId, req.body.email, req.session.accessToken, function(){
        _.each(req.body.fileId, function(id){
            queue.push(q.nfcall(shrFile, id, req.body.email, req.session.accessToken));
        });
        q.all(queue)
        .then(function(ful) {
            //
        }, function(rej) {
            //
        })
        .fail(function(err) {
            return next(err);
        })
        .fin(function() {
            res.send('success')
        });
    });
};


function retrieveStoreKeys(session, item, callback) {
    request
        .get(item.downloadUrl)
        .type('application/octet-stream')
        .set('Authorization', 'Bearer ' + session.accessToken)
        .parse(binaryParser)
        .buffer()
        .end(function(error, resp){
            if(error){
                callback(error);
            } else {
                var tt = crypto.decrypt(resp.body, global.key.toString('binary'));
                console.log(tt);
                session.keys[item.owners[0].permissionId] = tt;
                callback();
            }
        });
}

function mapFile(item, tKey, callback){
    console.log('key=' + tKey);
    console.log('title=' + item.title);
    var tt = crypto.decrypt(new Buffer(item.title, 'hex'), tKey).split('|');

    callback(null, {
       name: tt[0],
       type: 'file',
       documentType: tt[1],
       cipheredName: item.title,
       downloadUrl: encodeURIComponent(item.downloadUrl),
       id: item.id,
       permissionId: item.owners[0].permissionId,
       owners: item.owners
    });
}

function delFile(id, accessToken, callback){
    request
        .del('https://www.googleapis.com/drive/v2/files/' + id)
        .set('Authorization', 'Bearer ' + accessToken)
        .end(function(er, re){
            if(er){
                callback(er);
            } else {
                callback();
            }
        });
}

function shrFile(id, email, accessToken, callback){
    console.log(id);
    request
        .post('https://www.googleapis.com/drive/v2/files/' + id + '/permissions')
        .query({sendNotificationEmails: 'false'})
        .set('Authorization', 'Bearer ' + accessToken)
        .send({value: email, role: 'reader', type: 'user'})
        .end(function(er, re){
            if(er){
                callback(er);
            } else {
                callback();
            }
        });
}

function shrKey(key, email, accessToken, callback){
    console.log(key);
    request
        .post('https://www.googleapis.com/drive/v2/files/' + key + '/permissions')
        .query({sendNotificationEmails: 'false'})
        .set('Authorization', 'Bearer ' + accessToken)
        .send({value: email, role: 'reader', type: 'user'})
        .end(function(er, re){
            if(er){
                callback(er);
            } else {
                callback();
            }
        });
}

function binaryParser(res, callback) {
    //console.log(res);
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
        console.log(chunk);
        res.data += chunk;
    });
    res.on('end', function () {
        callback(null, new Buffer(res.data, 'binary'));
    });
     res.on('error', function (err) {
        callback(err, null);
    });
}
