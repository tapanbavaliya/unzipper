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
var users = db.collection('users');
var account = db.collection('account');
var sites = db.collection('sites');


//Users collection's methods
exports.autoLogin = function(email, pass, callback)
{
  users.findOne({email:email}, function(err, data) {
    if (data){
      data.pass == pass ? callback(data) : callback(null);
    } else{
      callback(null);
    }
  });
}

exports.manualLogin = function(email, pass, callback)
{
  users.findOne({email:email}, function(err, data) {
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
  var userId = '';
  users.findOne({email:data.email}, function(err,item){
    if(item){
      callback('Error: not unique email');
    }
    else{
      var dirName = createDirectoryname(data.email);
      saltAndHash(data.pass, function(hash){
        data.pass = hash;
        data.date = moment().format('MMMM Do YYYY, h:mm:ss a');
        fs.mkdir('output/'+dirName, function (err) {
          if (err) console.error(err);
        });
        users.insert({ 
          'name' : data.name,
          'email': data.email,
          'pass' : data.pass,
          'date' : data.date,
        }, {safe: true}, 
          function(error,records){
          //Insert Details also in account collection
            // userId = records[0]._id;
            // account.insert({'userId' : userId,
            //   'plan': data.plan}, {safe: true}, callback);
          });
      });
    }
  });
}

exports.userInfoByEmail = function(email, callback)
{
  users.findOne({email:email}, function(err, item){
    if(err)
    {
      console.log('Error : '+err);
    }
    callback(null, item);
  });
}


exports.getSiteListByEmail = function(email, callback)
{
  sites.find({'user_email':email}).toArray(function(err, data){
    if(err)
    {
      console.log(err);
    }
    callback(null, data);
  });

  // sites.find({'user_email': email}).toArray(function(data){
  //   console.log("Email := "+email);
  //   callback(null,data);
  // });  
}

exports.updateSite = function(data_id, siteName,callback)
{
  sites.update({ _id : ObjectID(data_id) },
    {
      $set : { site_name : siteName }
    },
    function(err)
    {
      if(err)
        console.log(err);
    }
  );
}

exports.editAccountNames = function(email, data, callback)
{
  users.update({email:email}, 
  {
    $set : { name : data.name }
  },
  function(err){
    if(err)
    {
      console.log(err);
    }
  });
}

exports.editAccountPass = function(email, data, callback)
{
  saltAndHash(data.pwd, function(hash){
    data.pwd = hash;
    users.update({email : email},
    {
      $set : { pass: data.pwd }
    },
    function(err){
      if(err)
        console.log(err);
      }
    )
  });
}

exports.getUserByEmail = function(email, callback)
{
  users.findOne({email:email}, function(e, o){ callback(o); });
}

//Account collection's methods
exports.addAccountDetails = function(data, callback)
{
  console.log('ObjectId :'+ObjectID(data.userId));
  account.update({userId:  ObjectID(data.userId)},
    {
      $set: { count: data.count }
    },
    function(err) {
      if(!err){
        console.log(data);
      }
    }
  );
}

exports.getAccountDetailsByUserId = function(userId, callback)
{
  account.findOne({userId: ObjectID(userId)},
    function(err, data){
      callback(null, data);
    }
  );
}


/*Supporting Methods*/

var createDirectoryname = function(email){
  var i = email.lastIndexOf('@');
  return (i < 0) ? '' : email.substr(0,i);
}

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