var https = require ('https');
var http = require ('http');
var url = require('url');
var request = require('request');
var fs = require('fs-extra');
var express = require('express');
var unzip = require('unzip');

var app = express();
require('./app/appConfig')(app);

require('./app/router')(app);


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
}).on('error',function(error){
	console.log("Error On:" ,error);
});