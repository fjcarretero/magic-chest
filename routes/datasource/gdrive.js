var _ = require('underscore'),
	logger = require('../../winston'),
    q = require('q'),
    formidable = require('formidable'),
    request = require('superagent'),
    crypto = require('../utilsCrypto'),
    crypto2 = require('crypto');

function GDrive(){

    var self = this;

    function retrieveStoreKeys(accessToken, session, item, callback) {
        session.keys = {};
//        console.log('entro');
        request
            .get(item.downloadUrl)
            .type('application/octet-stream')
            .set('Authorization', 'Bearer ' + accessToken)
            .parse(binaryParser)
            .buffer()
            .end(function(error, resp){
                if(error){
                    logger.error(error);
                    callback(error);
                } else {
//                    console.log(resp.body);
                    var tt = crypto.decrypt(resp.body, global.key);
                    session.keys[item.owners[0].permissionId] = tt;
//                    console.log(session.keys);
                    callback();
                }
            });
    };

    function binaryParser(res, callback) {
        res.setEncoding('binary');
        res.data = '';
        res.on('data', function (chunk) {
            res.data += chunk;
        });
        res.on('end', function () {
            callback(null, new Buffer(res.data, 'binary'));
        });
         res.on('error', function (err) {
            callback(err, null);
        });
    };

    function _mapFile(item){
        return {
           type: 'file',
           cipheredName: item.title,
           downloadUrl: encodeURIComponent(item.downloadUrl),
           id: item.id,
           permissionId: item.owners[0].permissionId,
           owners: item.owners
        };
    };

    function mapFile(item, tKey, callback){
        logger.info('title', item.title);
        var tt = crypto.decrypt(new Buffer(item.title, 'hex'), new Buffer(tKey, 'binary')).split('|');

        //logger.info('item=', item);

        var ret = _mapFile(item);

        ret.name = tt[0];
        ret.documentType = tt[1];

        logger.info(ret.name);

        callback(null, ret);
    };

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
    };

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
    };

    this.getKeys = function(accessToken, username, callback, callbackError){
        var ret = {};
        var queue = [];

        request
            .get('https://www.googleapis.com/drive/v2/files')
            .type('application/json')
            .query({q: "title = 'magic-chest' and mimeType='application/vnd.rig.cryptonote'"})
            .set('Authorization', 'Bearer ' + accessToken)
            .end(function(err, resp){
                if (err) {
                    callbackError(err);
                } else {
                    var response = resp.body;
    //                req.session.key = {};
                    //req.session.decryptors = {};
                    _.each(response.items, function(item){
        //                console.log(item);
                        if(item.owners[0].displayName === username){
    //                        req.session.permissionId = item.owners[0].permissionId;
    //                        req.session.keyFileId = item.id;
                            ret.permissionId = item.owners[0].permissionId;
                            ret.keyFileId = item.id;
							ret.folderId = item.parents[0].id;
							console.log(ret);
                        }
                        queue.push(q.nfcall(retrieveStoreKeys, accessToken, ret, item));
                    });
                    q.all(queue)
                    .then(function(ful) {
//                        console.log('ful');
                    }, function(rej) {
//                        console.log('rej ' + rej);
                    })
                    .fail(function(err) {
//                        console.log('err');
                        callbackError(err);
                    })
                    .fin(function() {
//                        console.log('fin');
                        callback(ret);
                    });
                }
            });
    };

    this.storeKey = function(accessToken, buf, callback, callbackError){
        var cipher = crypto2.createCipheriv('aes-128-cbc', global.key, '8888888888888888');

        var ret = {
            keys: {}
        };

				request
					.post('https://www.googleapis.com/upload/drive/v2/files')
					.type('application/vnd.google-apps.folder')
					.send({title: 'magic-chest'})
					.end(function(e,r){
						if(e){
							callbackError(e);
						} else {
							ret.folderId = r.body.id;
							console.log(r.body);

        			var r = request
            		.post('https://www.googleapis.com/upload/drive/v2/files')
            		.type('application/vnd.rig.cryptonote')
            		.query({uploadType: "media"})
            		.set('Authorization', 'Bearer ' +accessToken);
//        r.write(crypto.encrypt(buf, global.key.toString('binary')), 'binary');

        			r.write(cipher.update(buf, 'binary', 'binary'), 'binary');
        			r.write(cipher.final('binary'), 'binary');
        			r.end(function(err, res){
                if(err){
                    callbackError(err);
                } else {
                    request
                        .put('https://www.googleapis.com/drive/v2/files/' + res.body.id)
                        .type('application/json')
                        .set('Authorization', 'Bearer ' + accessToken)
                        .send({title: 'magic-chest', parents: [{id: ret.folderId}]})
                        .end(function(er, re){
                            if(er){
                                callbackError(er);
                            } else {
                                ret.permissionId = res.body.owners[0].permissionId;
                                ret.keyFileId = res.body.id;
                                ret.keys[ret.permissionId] = buf.toString('binary');
//                                console.log(ret);
                                callback(ret);
                            }
                        });
                }
            	});
						}
					});
    };

    this.getFiles = function(accessToken, keys, query, callback, callbackError){
        var r = [],
            queue = [];

        request
            .get('https://www.googleapis.com/drive/v2/files')
            .type('GET', 'application/json')
            .query({q: "title != 'magic-chest' and mimeType='application/vnd.rig.cryptonote'"})
            .set('Authorization', 'Bearer ' + accessToken)
            .end(function(err, resp){
                if (err){
                    logger.error('google get file error', err);
                    callbackError(err);
                } else {
                     logger.info('google get file success');
                    var response = resp.body;
                    //logger.info(response.items);
                    _.each(response.items, function(item){
                        //logger.info(item);
                        queue.push(q.nfcall(mapFile, item, keys[item.owners[0].permissionId]));
                    });
                    q.all(queue)
                        .then(function(ful) {
                            logger.info('google get file success 2');
                            callback(ful);
                        }, function(rej) {
                            // SEND AND ERRO
                            logger.error('Reject error: ', rej);
                        })
                        .fail(function(err) {
                            logger.error('Fail error: ', err);
                            callbackError(err);
                        })
                        .fin(function(ful) {
                            logger.info('Fin=', ful);
//                            callback(ful);
                        });
                }
            });
    };

    this.downloadFile = function(accessToken, url){
       return request
            .get(url)
            .type('application/octet-stream')
            .set('Authorization', 'Bearer ' + accessToken);
    };

    this.startUploadFile = function(accessToken){
        return request
            .post('https://www.googleapis.com/upload/drive/v2/files')
            .type('application/vnd.rig.cryptonote')
            .query({uploadType: "media"})
            .set('Authorization', 'Bearer ' + accessToken);
    };

    this.setProperties = function(stream, encname, filesize){
    };

    this.endUploadFile = function(accessToken, resp, encName, folderId, callback, callbackError){

				request
            .put('https://www.googleapis.com/drive/v2/files/' + resp.body.id)
            .type('application/json')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({title: encName, parents: [{id: folderId}]})
            .end(function(er, re){
                if(er){
                    callbackError(er);
                } else {
                    var item = re.body;
                    callback(_mapFile(item));
                }
            });
    };

    this.deleteFile = function(accessToken, ids, callback, callbackError){
        var queue = [];

        _.each(ids, function(id){
            queue.push(q.nfcall(delFile, id, accessToken));
        });
        q.all(queue)
        .then(function(ful) {
            //
        }, function(rej) {
            //
        })
        .fail(function(err) {
            callbackError(err);
        })
        .fin(function() {
            callback()
        });
    };

    this.shareFile = function(accessToken, fileId, keyFileId, email, callback, callbackError){
        var queue = [];

        shrKey(keyFileId, email, accessToken, function(){
            _.each(fileId, function(id){
                queue.push(q.nfcall(shrFile, id, email, accessToken));
            });
            q.all(queue)
            .then(function(ful) {
                //
            }, function(rej) {
                //
            })
            .fail(function(err) {
                callbackError(err);
            })
            .fin(function() {
                callback();
            });
        });
    };

    this.setDateTaken = function(accessToken, dateTaken, id, callback, callbackError){
    };
}

module.exports = GDrive;
