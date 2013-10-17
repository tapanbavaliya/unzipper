var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var dbPort    = 27017;
var dbHost    = 'localhost';
var dbName    = 'improwised';

var db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
  db.open(function(err, data){
  if (err) {
    console.log(err);
  } else{
    console.log('connected to database :: ' + dbName);
  }
});
var accounts = db.collection('accounts');

/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
  accounts.findOne({user:user}, function(err, data) {
    if (data){
      data.pass == pass ? callback(data) : callback(null);
    } else{
      callback(null);
    }
  });
}

exports.manualLogin = function(user, pass, callback)
{
  accounts.findOne({user:user}, function(err, data) {
    if (data == null){
      callback('user-not-found');
    } 
    else{
      validatePassword(pass, data.pass, function(error, res) {
        if (res){
          callback(null, data);
        } else{
          callback('invalid-password');
        }
      });
    }
  });
}