var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var crypto = require('crypto');

var moment 		= require('moment');
var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'improwised';

var db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
  db.open(function(err, data){
  if (err) {
    console.log(err);
  } else{
    console.log('connected to database :: ' + dbName);
  }
});
var accounts = db.collection('accounts');

exports.autoLogin = function(email, pass, callback)
{
  accounts.findOne({email:email}, function(err, data) {
    if (data){
      data.pass == pass ? callback(data) : callback(null);
    } else{
      callback(null);
    }
  });
}

exports.manualLogin = function(email, pass, callback)
{
  accounts.findOne({email:email}, function(err, data) {
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

exports.addNewAccount = function(data, callback)
{
  accounts.findOne({name:data.name}, function(e, o) {
    if (o){
      callback('username-taken');
    } 
    else{
      accounts.findOne({email:data.email}, function(err,item){
        console.log("Email:"+data.email);
        if(item){
          callback('Error: not unique email');
        }
        else{
          console.log(data.pass);
          saltAndHash(data.pass, function(hash){
            data.pass = hash;
            data.date = moment().format('MMMM Do YYYY, h:mm:ss a');
            fs.mkdir('output/'+data.name, function (err) {
              if (err) console.error(err)
            });
            accounts.insert(data, {safe: true}, callback);
          });
        }
      });
    }
  });
}

exports.getAccountByEmail = function(email, callback)
{
  accounts.findOne({email:email}, function(e, o){ callback(o); });
}


/*Supporting Methods*/

var generateSalt = function()
{
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
  var salt = '';
  for (var i = 0; i < 10; i++) {
    var p = Math.floor(Math.random() * set.length);
    salt += set[p];
  }
  return salt;
}

var md5 = function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
  var salt = generateSalt();
  callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
  var salt = hashedPass.substr(0, 10);
  var validHash = salt + md5(plainPass + salt);
  callback(null, hashedPass === validHash);
}