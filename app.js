var https = require ('https');
var http = require ('http');
var url = require('url');
var request = require('request');
var fs = require('fs-extra');
var express = require('express');
var unzip = require('unzip');

var app = express();
require('./appConfiguration')(app);

app.get("/", function (request, response) {
    response.render("upload.jade");
});

app.post("/upload", function (request, response){
    console.log("Path: "+request.files.fileName.path);
    var path = request.files.fileName.path;
    var type = request.files.fileName.type;
    console.log("Name:"+request.files.fileName.name);
    console.log("Type: "+type);
    if(type != 'application/zip'){
    	response.render("upload");
    	console.log("NOT ZIP");
    	response.end();
    }
    else{
    	console.log("Its a ZIP");

    	fs.createReadStream(request.files.fileName.path).pipe(unzip.Extract({ path: 'output/' }));
    	// .on('error', function (err) { console.log('error', err); })
    	// .on('close', function () { console.log('closed'); });

    	var file = getDirectoryName(request.files.fileName.name);
    	console.log("File:"+file);
    	fs.mkdirsSync('output/user');
    	var main = __dirname+'/output';
    	console.log(main);

    	var dir = __dirname+'/output/'+file;
    	console.log("Dir: "+dir+'/*');

    	fs.copy(dir+'/', __dirname+'/test', function(err){
		  if (err) return console.error(err);
		  console.log("success!")
		});

		// fs.copy(main, /*'/output/user'*/ __dirname, function(err){
		//   if (err) return console.error(err);
		//   console.log("success!")
		// });

		// fs.removeSync(dir+'/*');
		// fs.removeSync(dir);
    	response.end();
    }
});

function getDirectoryName(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(0,i);
}

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
}).on('error',function(error){
	console.log("Error On:" ,error);
});