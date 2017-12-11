/*
 * Serve JSON to our AngularJS client
 */
var _ = require('underscore'),
	logger = require('../../winston'),
    provider = require('../datasource');
    formidable = require('formidable'),
    crypto = require('../utilsCrypto'),
    crypto2 = require('crypto'),
    ExifImage = require('exif').ExifImage,
    moment = require('moment');

exports.uploadFile = function (req, res, next) {
	logger.info('upload File');

    var sKey = req.session.keys[req.session.permissionId];
//    console.log(new Buffer(sKey, 'binary'));
    var cipher = crypto2.createCipheriv('aes-128-cbc', new Buffer(sKey, 'binary'), '8888888888888888');
    var form = new formidable.IncomingForm();
    form.multiples = true;
    var encName;

    var bytesTransferred = 0;

    var providerImpl = provider.getProvider(req.session.provider);

    var req1 = providerImpl.startUploadFile(req.session.accessToken);

    form.onPart = function (part) {
        if (!part.filename) {
            // let formidable handle all non-file parts
            form.handlePart(part);
            return;
        }

        var tt = [];
        tt.push(part.filename);
        tt.push(part.mime);

        if(!req.session.progress) req.session.progress = {};

        req.session.progress[part.filename] = {
            state: 'MEDIA_IN_PROGRESS',
            progress: 0
        };

        encName = crypto.encrypt(tt.join('|'), new Buffer(sKey, 'binary')).toString('hex');

//        if (req.session.provider === 'flickr') {
//            logger.info(part.filename, form.bytesExpected);
//            req1.createPNG(encName, form.bytesExpected);
//        };

        providerImpl.setProperties(req1, encName, form.bytesExpected);

        var first = true;
        var dateTaken;

        part.on('data', function(data){
            if (first && part.mime==='image/jpeg'){
                new ExifImage({image: data}, function(error, exifData){
                    if (error) {
                        logger.error(error.message);
                    } else {
			logger.info( exifData.exif.DateTimeOriginal);
                        dateTaken = moment(exifData.exif.DateTimeOriginal, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
                    }
                });
            first = false;
            }
            bytesTransferred += data.length;
//            console.log(bytesTransferred + "-" + form.bytesExpected);
//            progress.progress = bytesTransferred/form.bytesExpected*100;
            logger.silly(part.filename + "-----" + bytesTransferred/form.bytesExpected*100);
            req.session.progress[part.filename].progress = bytesTransferred/form.bytesExpected*100;
            req.session.save();
            req1.write(cipher.update(data, 'binary', 'binary'), 'binary');
        });

        part.on('end', function(){
            logger.info('end');

            req1.write(cipher.final('binary'), 'binary');
            req1.end(function(resp){
//                console.log(resp);
                providerImpl.endUploadFile(req.session.accessToken, resp, encName, req.session.folderId,
                    function(item){
                        item.name = part.filename;
                        item.documentType = part.mime;
//                        progress.progress = 100;
//                        progress.state = 'MEDIA_COMPLETE';
//                        progress.item = item;
                        req.session.progress[part.filename].progress = 100;
                        req.session.progress[part.filename].state = 'MEDIA_COMPLETE';
                        res.json(item);
                        if (req.session.provider === 'flickr') {
                            req1.destroy(encName);
                        }
                        if (dateTaken && dateTaken.isValid()) {
                             providerImpl.setDateTaken(req.session.accessToken, dateTaken, item.id);
                        }
                    },
                    function(er){
                         return next(er);
                    });
            });
        });

        part.on('error', function(err){
            return next(err);
        });
    }

//    console.log(req);
    form.parse(req);
};
