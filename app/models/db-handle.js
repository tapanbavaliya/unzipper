var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var async = require('async');
DBHandler = function(host, port) {
  this.db= new Db('improwised', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(error){
  	if(error){
  		console.log('Error : ', error);
  	} else {
  		console.log('Database connected.');
  	}
  });
};