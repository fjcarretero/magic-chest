var _ = require('underscore'),
	logger = require('../../winston'),
    q = require('q'),
    formidable = require('formidable'),
    request = require('superagent'),
    crypto = require('../utilsCrypto'),
    crypto2 = require('crypto');

function DropBox(){


    function _mapFile(item){
        return {
           type: 'file',
           cipheredName: item.path.substring(1),
           downloadUrl: encodeURIComponent(item.path.substring(1)),
           id: item.path,
           permissionId: 'db',
           owners: item.owners
        };
    };

    function mapFile(item, tKey, callback){
        var tt = crypto.decrypt(new Buffer(item.path.substring(1), 'hex'), tKey).split('|');

        var ret = _mapFile(item);
        ret.name = tt[0];
        ret.documentType = tt[1];

        callback(null, ret);
    };

    function delFile(id, accessToken, callback){
        request
            .post('https://api.dropbox.com/1/fileops/delete')
            .type('form')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({root: 'sandbox', path: id})
            .end(function(er, re){
                if(er){
                    callback(er);
                } else {
                    callback();
                }
            });
    };

    function binaryParser(res, callback) {
        res.setEncoding('binary');
        res.data = '';
        res.on('data', function (chunk) {
//            logger.silly(chunk);
            res.data += chunk;
        });
        res.on('end', function () {
            callback(null, new Buffer(res.data, 'binary'));
        });
         res.on('error', function (err) {
            callback(err, null);
        });
    };

    this.getKeys = function(accessToken, username, callback, callbackError){
        var ret = {};
        var queue = [];

        request
            .get('https://api-content.dropbox.com/1/files/sandbox/magic-chest')
            .type('text/plain')
            .set('Authorization', 'Bearer ' + accessToken)
            .end(function(err, resp){
                if (err) {
                    logger.error(err);
                    callbackError(err);
                } else {
                    if (resp.error){
                        logger.error(resp.error);
                    } else {
                        var response = resp;
                        var tt = crypto.decrypt(new Buffer(resp.text, 'hex'), global.key.toString('binary'));
                        ret.permissionId = 'db';
                        ret.keyFileId = 'id';
                        ret.keys = {'db': tt};
                    }
                    callback(ret);
                }
            });
    };

    this.storeKey = function(accessToken, buf, callback, callbackError){
        var ret = {};
        var kk = crypto.encrypt(buf, global.key.toString('binary')).toString('hex');
        var rq = request
            .post('https://api-content.dropbox.com/1/files_put/sandbox/magic-chest')
            .type('text/plain')
            .set('Authorization', 'Bearer ' + accessToken)
            .send(kk)
            .end(function(err, res){
                if(err){
                    callbackError(err);
                } else {
                    ret.permissionId = 'db'
                    ret.keyFileId = 'id';
                    ret.keys = {'db': buf};
                    callback(ret);
                }
            });
    };

    this.getFiles = function(accessToken, keys, query, callback, callbackError){
        var r = [],
            queue = [];

        request
            .get('https://api.dropbox.com/1/metadata/sandbox/')
            .set('Authorization', 'Bearer ' + accessToken)
            .end(function(err, resp){
                if (err){
                    callbackError(err);
                } else {
//                    logger.silly(resp);
                    var response = JSON.parse(resp.text);
                    _.each(response.contents, function(item){
                        if(item.path !== '/magic-chest'){
                            queue.push(q.nfcall(mapFile, item, keys['db']));
                        }
                    });
                    q.all(queue)
                        .then(function(ful) {
//                           callback(ful);
                        }, function(rej) {
                            // SEND AND ERRO
                            logger.error(rej);
                        })
                        .fail(function(err) {
                            //
                            callbackError(err);
                        })
                        .fin(function() {
                            //
                        });
                }
            });
    };

    this.downloadFile = function(accessToken, url){
       return request
            .get('https://api-content.dropbox.com/1/files/sandbox/' + url)
            .type('application/octet-stream')
            .set('Authorization', 'Bearer ' + accessToken);
    };

    this.startUploadFile = function(accessToken){
        return request
            .put('https://api-content.dropbox.com/1/chunked_upload')
//            .type('application/vnd.rig.cryptonote')
            .set('Authorization', 'Bearer ' + accessToken);
    };

    this.setProperties = function(stream, encname, filesize){
    };

    this.endUploadFile = function(accessToken, resp, encName, folderId, callback, callbackError){
        var uId = JSON.parse(resp.text)['upload_id'];
        logger.silly(uId);
        request
            .post('https://api-content.dropbox.com/1/commit_chunked_upload/sandbox/' + encName)
            .type('form')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({upload_id: uId})
            .end(function(er, re){
                if(er){
                    logger.error(er);
                    callbackError(er);
                } else {
//                    logger.silly(re);
                    var item = JSON.parse(re.text);
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
}

module.exports = DropBox;
