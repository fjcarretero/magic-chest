var _ = require('underscore'),
	logger = require('../../winston'),
    q = require('q'),
    formidable = require('formidable'),
    request = require('superagent'),
    crypto = require('../utilsCrypto'),
    stream = require('stream'),
    fs = require('fs'),
    PNG = require('node-png').PNG,
    myPNG = require('./myPNG'),
    crypto2 = require('crypto');

var str = new Buffer('<fin>');

function Flickr(){

    function setAuthVals() {
      var options = {};
      var timestamp = "" + Date.now(),
          md5 = crypto2.createHash('md5').update(timestamp).digest("hex"),
          nonce = md5.substring(0,32);
      options.oauth_timestamp = timestamp;
      options.oauth_nonce = nonce;
      return options;
    };

    function formQueryString(queryArguments) {
      var args = [],
          append = function(key) {
            args.push(key + '=' + encodeURIComponent(queryArguments[key]));
          };
      Object.keys(queryArguments).sort().forEach(append);
      return args.join("&");
    };

    function formBaseString(verb, url, queryString) {
      return [verb, encodeURIComponent(url), encodeURIComponent(queryString)].join("&");
    };

    function sign(data, key, secret) {
      var hmacKey = key + "&" + (secret ? secret : ''),
          hmac = crypto2.createHmac("SHA1", hmacKey);
//     logger.info('hmackey', hmacKey);
      hmac.update(data);
      var digest = hmac.digest("base64");
      return digest;
    };

    function prepareCall(url, verb, options, accessToken) {
        var fOptions = setAuthVals();
        options.oauth_signature_method = "HMAC-SHA1";
        options.oauth_consumer_key = global.flickrOptions.api_key;
        options.oauth_token = accessToken.access_token;
        options.oauth_nonce = fOptions.oauth_nonce;
        options.oauth_timestamp = fOptions.oauth_timestamp;

        var queryString = formQueryString(options);
        var data = formBaseString(verb, url, queryString);
//        logger.info('baseString', data);
        options.oauth_signature = sign(data, global.flickrOptions.secret, accessToken.access_token_secret);

        // and finally, form the URL we need to POST to
        var signature = "&oauth_signature=" + encodeURIComponent(options.oauth_signature);
        return url + "?" + queryString + signature;
    };

    function _mapFile(item){
        return {
           type: 'file',
           cipheredName: item.title,
           downloadUrl: encodeURIComponent('https://farm'+ item.farm +'.staticflickr.com/' + item.server + '/' + item.id +'_' +item.originalsecret + '_o.png'),
           id: item.id,
           permissionId: 'flr',
           owners: item.owner
        };
    };

    function mapFile(item, tKey, callback){
        var tt = crypto.decrypt(new Buffer(item.title, 'hex'), new Buffer(tKey, 'binary')).split('|');

        var ret = _mapFile(item);
        ret.name = tt[0];
        ret.documentType = tt[1];

        callback(null, ret);
    };

    function delFile(id, accessToken, callback){

        var options = {
            method: 'flickr.photos.delete',
            photo_id: id,
            format: 'json',
            nojsoncallback: 1
        };

        var u = prepareCall('https://api.flickr.com/services/rest/', "POST", options, accessToken);

        var rq = request
            .post('https://api.flickr.com/services/rest/')
            .type('json')
            .accept('json');

            _.each(_.keys(options), function(field) {
                rq.field(field, options[field]);
            });

            rq.end(function(er, re){
                logger.info(re.body);
                logger.info(er);
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

    function createKeyPNGFile(buf, filename, callback){
        var s = new stream.Readable();
        s._read = function noop() {}; // redundant? see update below
        s.push(buf);
        s.push(null);

        var pp = new PNG({width:57,height:57});

        var offset = 0;
        s.on('data', function(chunk) {
            chunk.copy(pp.data, offset);
            offset +=  chunk.length;
        }).
        on('end', function(){
            (new Buffer('<fin>')).copy(pp.data, offset);
            pp.pack().pipe(fs.createWriteStream(filename));
            callback();
        });

    };

    function getKeyPNGData(d, callback){

        var s = new stream.Readable();
        s._read = function noop() {}; // redundant? see update below
        s.push(new Buffer(d));
        s.push(null);

        var offset = 0;

        s.pipe(new PNG({}))
            .on('parsed', function() {
                var i = indexOf(this.data, new Buffer('<fin>'));
                var b = new Buffer(i);
                this.data.copy(b, 0, offset, i);
                callback(b.toString());
            });
    };

    function indexOf(buf1, buf2){
        for (var i = 0 ; i < buf1.length ; i++) {
            if (buf1[i] === buf2[0]) {
                if (_equals(buf1, i, buf2)) {
                    return i;
                }
            }
//            console.log(this.data[i]);
        }
//        console.log(len);
    };

    function _equals(buf1, offset, buf2){
        var ret = true;
        for (var i = 1 ; i < buf2.length ; i++) {
            ret &= buf1[offset + i] === buf2[i];
        }

        return ret;
    };

    this.getKeys = function(accessToken, username, callback, callbackError){
        var ret = {};
        var queue = [];

        var options = {
            method: 'flickr.photos.search',
            user_id: accessToken.user_id,
            tags: 'magic-chest',
            extras: 'original_format',
            format: 'json',
            nojsoncallback: 1
        };

        prepareCall('https://api.flickr.com/services/rest/', "GET", options, accessToken);

        var rq = request
            .get('https://api.flickr.com/services/rest/')
            .type('json')
            .accept('json');
        rq.query(options);

        rq.end(function(err, resp){
            if (err) {
                logger.error('err',err);
                callbackError(err);
            } else {
                if (resp.error){
                    logger.error('error', resp.error);
                } else {
//                    logger.info('resp', resp.body.photos.photo);

                    var response = resp.body;
                    if(response.photos.photo.length > 0) {
                        _.each(response.photos.photo, function(photo){
//                             logger.info('https://farm'+ photo.farm +'.staticflickr.com/' + photo.server + '/' + photo.id +'_' +photo.originalsecret + '_o.png');

                            request
                                .get('https://farm'+ photo.farm +'.staticflickr.com/' + photo.server + '/' + photo.id +'_' +photo.originalsecret + '_o.png')
                                .type('image/png')
                                .parse(binaryParser)
                                .buffer()
                                .end(function(err, resp2){
                                    getKeyPNGData(resp2.body, function(data){
                                        var tt = crypto.decrypt(new Buffer(data, 'hex'), global.key);
//                                        logger.info(tt);
                                        ret.permissionId = 'flr';
                                        ret.keyFileId = 'flr';
                                        ret.keys = {'flr': tt};
                                        callback(ret);
                                    });
                                });
                        });

                    } else {
                        callback(ret);
                    }
                }
            }
        });
    };

    this.storeKey = function(accessToken, buf, callback, callbackError){
        logger.info(buf.toString());
        var kk = crypto.encrypt(buf, global.key.toString('binary')).toString('hex');

        createKeyPNGFile(kk, 'k.png', function(){

            var options = {
                tags: 'magic-chest',
                title: 'magic-chest',
                content_type: 1,
                hidden: 2,
                is_public: 0,
                is_friend: 0,
                is_family: 0,
                format: 'json',
                nojsoncallback: 1
            };

            prepareCall('https://up.flickr.com/services/upload/', "POST", options, accessToken);

            var ret = {};
            var rq = request
                .post('https://up.flickr.com/services/upload/');
            rq.type('multipart/form-data');
            _.each(_.keys(options), function(field) {
                rq.field(field, options[field]);
            });

            rq.attach('photo', './k.png', 'k.png');

            rq.end(function(err, res){
                logger.info('body', res.text);
                if(err){
                    callbackError(err);
                } else {
                    logger.info('res');
                    ret.permissionId = 'flr'
                    ret.keyFileId = 'flr';
                    ret.keys = {'flr': buf};
                    callback(ret);
                }
            });
        });
    };

    this.getFiles = function(accessToken, keys, query, callback, callbackError){
        var r = [],
            queue = [];

        var options = {
            method: 'flickr.photos.search',
            user_id: accessToken.user_id,
            per_page: 500,
            extras: 'original_format',
            format: 'json',
            nojsoncallback: 1
        };

        if (query.from) options.min_taken_date = query.from;
        if (query.to)   options.max_taken_date = query.to;

        prepareCall('https://api.flickr.com/services/rest/', "GET", options, accessToken);

        var rq = request
            .get('https://api.flickr.com/services/rest/')
            .type('json')
            .accept('json');
        rq.query(options);

        rq.end(function(err, resp){
//            logger.info(resp.body);
            if (err){
                callbackError(err);
            } else {
//                    logger.silly(resp);
                _.each(resp.body.photos.photo, function(item){
                    if(item.title !== 'magic-chest'){
                        queue.push(q.nfcall(mapFile, item, keys['flr']));
                    }
                });
                q.all(queue)
                    .then(function(ful) {
                       callback(ful);
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

        var png = new myPNG();
        png.createPNG();
        png.readStream(request
            .get(url)
            .type('image/png')
        );
        return png.getStream();
    };

    this.startUploadFile = function(accessToken){
        return new myPNG();;
    };

    this.setProperties = function(stream, encname, filesize){
        stream.createPNG(encname, filesize);
    };

    this.endUploadFile = function(accessToken, resp, encName, folderId, callback, callbackError){
        logger.info('endUploadFile');

        var options = {
            tags: 'rest',
            title: encName,
            content_type: 1,
            hidden: 2,
            is_public: 0,
            is_friend: 0,
            is_family: 0,
            format: 'json',
            nojsoncallback: 1
        };

        prepareCall('https://up.flickr.com/services/upload/', "POST", options, accessToken);

        var item = {
           type: 'file',
           cipheredName: encName,
           permissionId: 'flr'
        };

        var rq = request
            .post('https://up.flickr.com/services/upload/');
        rq.type('multipart/form-data');
        _.each(_.keys(options), function(field) {
            rq.field(field, options[field]);
        });

        rq.attach('photo', './' + encName + '.png', encName + '.png');

        rq.end(function(er, re){
            logger.info(re.text);
            if(er){
                callbackError(er);
            } else {
                if(!re.text) {
                    callbackError("No body found in response");
                } else if (re.text.indexOf('rsp stat="ok"') > -1) {
                    item.id = parseInt(re.text.split("<photoid>")[1].split("</photoid>")[0], 10);
                    callback(item);
                }
            }
        });
    };

    this.setDateTaken = function(accessToken, dateTaken, id, callback, callbackError){

        var options = {
            method: 'flickr.photos.setDates',
            photo_id: id,
            date_taken:  dateTaken,
            date_taken_granularity: 0,
            format: 'json',
            nojsoncallback: 1
        };

        prepareCall('https://api.flickr.com/services/rest/', "POST", options, accessToken);

        var rq = request
            .post('https://api.flickr.com/services/rest/')
            .type('json')
            .accept('json');

            _.each(_.keys(options), function(field) {
                rq.field(field, options[field]);
            });

            rq.end(function(er, re){
                if(er){
                    logger.error('er', er);
                    if(callbackError) callbackError(er);
                } else {
                    logger.info(re.body);
                    if (callback) callback();
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

module.exports = Flickr;
