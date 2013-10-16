var https = require ('https');
var http = require ('http');
var url = require('url');
var request = require('request');
var fs = require('fs');
var express = require('express');
var unzip = require('unzip');

var app = express();
require('./appConfiguration')(app);

app.get("/", function (request, response) {
    response.render("upload.jade");
});

app.post("/upload", function (request, response){
    console.log("Path: "+request.files.fileName.path);
    var type = request.files.fileName.type;
    console.log("Type: "+type);
    if(type != 'application/zip'){
    	response.render("upload");
    	console.log("NOT ZIP");
    	response.end();
    }
    else{
    	fs.createReadStream(request.files.fileName.path).pipe(unzip.Extract({ path: 'output/' }));
    	console.log("ZIP");
    }
    response.end();
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
}).on('error',function(error){
	console.log("Error On:" ,error);
});