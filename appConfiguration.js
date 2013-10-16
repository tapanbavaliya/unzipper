var express = require('express');
var connect = require('connect');


var Session = require('connect').middleware.session.Session;
var RedisStore= require('connect-redis')(express);
var sStore  = new RedisStore();
var redis = require("redis").createClient();


module.exports = function(app){
  app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {layout: false});
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.session({store: sStore,secret: '1234567890QWERTY'}));
    
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.static(__dirname, 'public'));
    app.use(app.router);
  });
};

