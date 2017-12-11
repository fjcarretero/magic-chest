/*
 * Serve JSON to our AngularJS client
 */
var logger = require('../winston'),
    crypto = require('crypto');

var iv = '8888888888888888';

exports.decrypt = function (buffer, key) {
	logger.info('Decrypt', key);

    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);

    logger.silly(buffer.toString('hex'));
    logger.silly(new Buffer(key, 'binary').toString('hex'));
    var chunks = [];
    chunks.push(decipher.update(buffer, null, 'binary'));
    chunks.push(decipher.final('binary'));
    var tt = chunks.join("");
    return tt;

};

exports.encrypt = function (buffer, key) {
//	logger.info('Encrypt');

    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);

//    logger.silly(buffer);

    var tt = [];
    tt.push(cipher.update(buffer));
    tt.push(cipher.final());

    var buf = Buffer.concat(tt);

    return buf;

};
