/*
 * Serve JSON to our AngularJS client
 */
var _ = require('underscore'),
	logger = require('../winston'),
    q = require('q'),
    request = require('superagent'),
    crypto = require('./utilsCrypto'),
    crypto2 = require('crypto'),
    provider = require('./datasource');

exports.getKeys = function (req, res, next) {
	logger.info('Get Keys');
    var queue = [];
    var providerImpl = provider.getProvider(req.session.provider);

    providerImpl.getKeys(req.session.accessToken, req.user.name,
        function(response){
//            console.log(response);
            req.session.permissionId = response.permissionId;
            req.session.keyFileId = response.keyFileId;
            req.session.keys = response.keys;
			req.session.folderId = response.folderId;
            return next()
        },
        function(error){
            return next(error);
        });
};

exports.generateKey = function (req, res, next) {
    logger.info('Generate Key');
    crypto2.randomBytes(16, function(ex, buf) {
        if(ex){
            return next(ex);
        } else {
            var providerImpl = provider.getProvider(req.session.provider);

            providerImpl.storeKey(req.session.accessToken, buf,
                function(response){
                    req.session.permissionId = response.permissionId;
                    req.session.keyFileId = response.keyFileId;
                    req.session.keys = response.keys;
					req.session.folderId = response.folderId;
                    return next()
                },
                function(error){
                    return next(error);
                });
        }
    });
};

exports.getFiles = function (req, res, next) {
	logger.info('Get Files');

    var providerImpl = provider.getProvider(req.session.provider);

    logger.info(req.session.provider);

    providerImpl.getFiles(req.session.accessToken, req.session.keys, req.query,
        function(response){
           logger.info('salgo');
            res.json(response);
        },
        function(error){
            logger.error('Get files error', error);
            return next(error);
        });
};

exports.downloadFile = function (req, res, next) {
	logger.info('download File');
    logger.info(req.query);
    var sKey = req.session.keys[req.query.permissionId];

    var tt = crypto.decrypt(new Buffer(req.query.fileName, 'hex'), new Buffer(sKey,'binary')).split('|');

    var mimetype = tt[1];
    if (!mimetype) {
	   mimetype = "application/octet-stream";
	}
    res.header('Content-Type', mimetype);
    res.header('Content-Disposition', 'attachment; filename="' + tt[0] + '"');
    var decipher = crypto2.createDecipheriv('aes-128-cbc', sKey, '8888888888888888');

    var dat;

    var providerImpl = provider.getProvider(req.session.provider);

    var r = providerImpl.downloadFile(req.session.accessToken, req.query.url);

    r.pipe(decipher).pipe(res);
};

exports.deleteFile = function (req, res, next) {
	logger.info('delete File');
    logger.info(req.body);
    var providerImpl = provider.getProvider(req.session.provider);

    providerImpl.deleteFile(req.session.accessToken, req.body,
        function(){
           res.json(req.body);
        },
        function(error){
            return next(error);
        });
};

exports.shareFile = function (req, res, next) {
    var providerImpl = provider.getProvider(req.session.provider);

//    providerImpl.shareFile(req.session.accessToken, req.body.fileId, req.session.keyFileId, req.body.email,
//        function(){
//            res.status(200).send('success') ;
//        },
//        function(error){
//            return next(error);
//        });
//    var queue = [];
//
//    shrKey(req.session.keyFileId, req.body.email, req.session.accessToken, function(){
//        _.each(req.body.fileId, function(id){
//            queue.push(q.nfcall(shrFile, id, req.body.email, req.session.accessToken));
//        });
//        q.all(queue)
//        .then(function(ful) {
//            //
//        }, function(rej) {
//            //
//        })
//        .fail(function(err) {
//            return next(err);
//        })
//        .fin(function() {
//            res.send('success')
//        });
//    });
    res.status(200).send('success') ;
};

exports.getStatus = function (req, res, next) {
    logger.info('status of File ' + req.params.id);

//    logger.info(req.session.);

    if (req.session.progress[req.params.id]){
        res.json(req.session.progress[req.params.id]);
    } else {
        res.json({
            state: 'MEDIA_IN_PROGRESS',
            progress: 0
        });
    }
};

exports.setDateTaken = function (req, res, next) {
    logger.info('modify File',req.params.id, req.body);

    var providerImpl = provider.getProvider(req.session.provider);

    providerImpl.setDateTaken(req.session.accessToken, req.body.dateTaken, req.params.id,
        function(){
            res.json(req.body);
        },
        function(error){
            return next(error);
        });

};

function shrFile(id, email, accessToken, callback){
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
