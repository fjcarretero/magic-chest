/*
 * Serve JSON to our AngularJS client
 */
var _ = require('underscore'),
	logger = require('../../winston'),
    provider = require('../datasource'),
    Busboy = require('busboy'),
    crypto = require('../utilsCrypto'),
    crypto2 = require('crypto');

exports.uploadFile = function (req, res, next) {
	logger.info('upload File');

    var sKey = req.session.keys[req.session.permissionId];
//    console.log(new Buffer(sKey, 'binary'));
    var cipher = crypto2.createCipheriv('aes-128-cbc', sKey, '8888888888888888');

	// Create an Busyboy instance passing the HTTP Request headers.
	var busboy = new Busboy({ headers: req.headers });
	
    var encName;

    var bytesTransferred = 0;
    
    var providerImpl = provider.getProvider(req.session.provider);
    
    var req1 = providerImpl.startUploadFile(req.session.accessToken);

    var progress = {
        state: 'MEDIA_IN_PROGRESS',
        progress: 0
    };

	// Listen for event when Busboy finds a file to stream.
	busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        logger.info('file');   
        var tt = [];
        tt.push(filename);
        tt.push(mimetype);

        encName = crypto.encrypt(tt.join('|'), sKey).toString('hex');    

        file.on('data', function (data) {
          logger.silly('data');
          console.log(part.filename + "----------------------------------------------------");
          bytesTransferred += data.length;
    //    console.log(bytesTransferred + "-" + form.bytesExpected);
          progress.progress = bytesTransferred/form.bytesExpected;
          req.session.progress[part.filename] = progress;
          req.session.save();
          req1.write(cipher.update(data, 'binary', 'binary'), 'binary');
        });

        // Completed streaming the file.
        file.on('end', function () {
            logger.info('end');
            
            req1.write(cipher.final('binary'), 'binary');
            req1.end(function(resp){
//                console.log(resp);
                providerImpl.endUploadFile(req.session.accessToken, resp, encName,
                    function(item){
                        item.name = part.filename;
                        item.documentType = part.mime;
                        progress.state = 'MEDIA_COMPLETE';
                        req.session.progress[part.filename] = progress;
                        res.json(item);
                    },
                    function(er){
                         return next(er);
                    });
            });
        });
        
        // Listen for event when Busboy finds a non-file field.
        busboy.on('field', function (fieldname, val) {
          logger.info('field');
        });

        // Listen for event when Busboy is finished parsing the form.
        busboy.on('finish', function () {
          logger.info('finish');
        });

        // Pipe the HTTP Request into Busboy.
        req.pipe(busboy);
    });
        
};