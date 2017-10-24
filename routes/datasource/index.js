/*
 * Serve JSON to our AngularJS client
 */
var GDrive = require('./gdrive'),
    DropBox = require('./dropbox'),
    Flickr = require('./flickr');

exports.getProvider = function(provider){
    if (provider === 'google') {
        return new GDrive();
    } else if (provider === 'flickr') {
        return new Flickr();
    } else if (provider === 'dropbox') {
        return new DropBox();
    }
};