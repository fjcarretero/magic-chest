'use strict';


var util = require('util'),
    _ = require('underscore'),
    PNG = require('node-png').PNG,
    stream = require('stream'),
    logger = require('../../winston'),
    fs = require('fs');
    

var sizes = [{
    width:  57,
    height: 57
},{
    width:  320,
    height: 240
},{
    width:  640,
    height: 480
},{
    width:  1024,
    height: 768
},{
    width:  1280,
    height: 960
},{
    width:  1536,
    height: 1180
},{
    width:  1600,
    height: 1200
},{
    width:  2048,
    height: 1536
},{
    width:  2240,
    height: 1680
},{
    width:  2560,
    height: 1920
},{
    width:  3032,
    height: 2008
},{
    width:  3072,
    height: 2304
},{
    width:  3264,
    height: 2448
}];

_.each(sizes, function(size) {
    size.size = 4 * size.width * size.height;
});

var str = new Buffer('<fin>');

function myPNG() {
    this.offset = 0;
    this.pp;
    this.wstream;
};

myPNG.prototype.createPNG = function(name, fileSize){
    logger.info('createPNG');
    if(fileSize){
        var dim = calculateDimensions(fileSize);
        this.pp = new PNG({width: dim.width, height: dim.height});
        this.wstream = fs.createWriteStream(name + '.png');
    } else {
        this.pp = new PNG();
        this.wstream = new stream.Readable();
        this.wstream._read = function noop() {};
    }
};

myPNG.prototype.write =  function (chunk, encoding) {
    var ch = chunk;
    if(typeof chunk === 'string'){
//        logger.info('string');
        ch = new Buffer(chunk, encoding);
    } 
    ch.copy(this.pp.data, this.offset);    
    this.offset +=  ch.length;
};

myPNG.prototype.end =  function (cb) {
    (str).copy(this.pp.data, this.offset);
    this.pp.pack().pipe(this.wstream);
    this.wstream.on('finish', function () { 
        cb();
    });
};

myPNG.prototype.destroy =  function (name) {
    fs.unlink(name + '.png', function(err){
        logger.error(err);
    });
};

myPNG.prototype.readStream =  function (stream) {
    var self = this;
    
    stream
        .pipe(this.pp)
        .on('parsed', function() {
            var i = indexOf(this.data, str);
            var b = new Buffer(i);
            this.data.copy(b, 0, 0, i);
            self.wstream.push(b);
            self.wstream.push(null);
        });
};

myPNG.prototype.getStream = function (){
    return this.wstream;
};

function calculateDimensions(size){
    for(var i = 0 ; i < sizes.length ; i++) {
        if (sizes[i].size > size) {
            return sizes[i];
        }
    }
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

module.exports = myPNG;