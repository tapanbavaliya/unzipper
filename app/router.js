var fs = require('fs-extra');
var unzip = require('unzip');
var async = require('async');
var path = require('path');
var DB = require('./models/db-handle');

module.exports = function(app) {

// main login page //

  app.get('/', function(req,res){
    if(req.session.email != null)
    {
      res.redirect('upload');
    }
    else{
      res.render('index');
    }
  });

  app.get('/login', function(req, res){

    console.log("Session:"+req.cookies.user);
    if (req.session.email == undefined){
      res.render('login', { title: 'Login' });
    }
    else{
      DB.autoLogin(req.cookies.email, req.cookies.pass, function(data){
        res.redirect('/upload');   
      });
    }
  });

  app.post('/', function(req, res){
    DB.manualLogin(req.param('email'), req.param('pass'), function(err, data){
      console.log('Inside manual login');
      if (!data){
        res.send(err, 400);
      } else{
        console.log(data);
          req.session.email = data.email;
          req.session.name = data.name;
          req.session.userId = data._id;
          req.session.data = data;

          console.log(req.param('remember-me'));
        if (req.param('remember-me') == 'true'){
          res.cookie('email', data.email, { maxAge: 900000 });
          res.cookie('pass', data.pass, { maxAge: 900000 });
        }
        res.redirect('/upload');
      }
    });
  });

  app.get('/logout', function(req,res){
    req.session.destroy();
    res.redirect('/login');
    res.end();
  });

  app.get('/demoUpload', function(req,res){
    res.render('test');
  });

  app.get('/register', function(req, res){
    if(req.session.email != null)
    {
      res.redirect('upload');
    }
    else
    {
      res.render('register');
    }
  });

  app.post('/register', function(req, res){
    DB.addNewAccount({
      name  : req.param('name'),
      email : req.param('email'),
      pass  : req.param('pass')
    }, function(err){
      if (err){
        res.send(err, 400);
      } else{
        res.send('A/c created', 200);
      }
    });
  });

  app.get('/dashboard', function(req,res){
    //Code to get all site details
    if(req.session.email == null || req.session.email == undefined){
      res.redirect('/login');
    }
    else
    {
      var i,totalSizeBytes;
      var dirName = createDirectoryname(req.session.email);
      var sites = [];
      fs.readdir('output/'+dirName, function(err,list){
        if (!err){
          list.forEach(function(item){
            console.log(item);
            sites.push(item);
          });
        }
        if(sites.length > 0){
          readSizeRecursive('output/'+dirName, function(err,item){
            item = (item/(1024*1024));
            console.log('Total Space:'+(item));
          });
        }

        console.log('Sites: '+sites);
        res.render('dashboard',{sites : sites, url :'/dashboard'});
      });
    }
  });

  function readSizeRecursive(item, cb) {
    fs.lstat(item, function(err, stats) {
      var total = stats.size;
      if (!err && stats.isDirectory()) {
        fs.readdir(item, function(err, list) {
          console.log("readSizeRecursive :"+ item);
          async.forEach(
            list,
            function(diritem, callback) {
              readSizeRecursive(path.join(item, diritem), function(err, size) {
                total += size;
                callback(err);
              });
            },
            function(err) {
              cb(err, total);
            }
          );
        });
      }
      else {
        cb(err, total);
      }
    });
  }

  app.get('/account', function(req, res){
    if( req.session.email == null )
    {
      res.redirect('/login');
    }
    DB.userInfoByEmail(req.session.email, function(err, item){
      if(err)
      {
        console.log("Error : "+err);
      }
      res.render('user',{item : item, url : '/account'});
    });
  });

  app.post('/editName', function(req, res){
    DB.editAccountNames(req.session.email, 
      {name  : req.param('name')},
      function(err){
        if(err)
          console.log("Error: "+err);
      }
    )
    res.redirect('/account');
  });

  app.get('/test', function(req, res){
    res.render('test');
  });



  app.post('/editPass', function(req, res){
    if(req.param('pwd') != req.param('c_pwd'))
    {
      res.send("Password Does not match.");
    }
    else
    {
      DB.editAccountPass(req.session.email,
        {pwd : req.param('pwd'),
         c_pwd : req.param('c_pwd') },
         function(err)
         {
          if(err)
            console.log(err);
         }
        )
      res.redirect('/account');
    }
  });


  app.get('/demo', function(req, res){
    res.render('demo');
  });

  app.post('/demoUpload', function(req,res){
    console.log("Value : "+req.get('path'));
    req.on('data', function (chunk) {
      fs.writeFile('output/tmp', chunk, function(err){
        if(err)
          console.log(err);
      });
    });

  });

  app.get('/upload', function(req,res){
    if (req.session.email == null){
      res.redirect('/login');
    }
    else{
      DB.getAccountDetailsByUserId(req.session.userId, function(err,item){
        if(err){
          console.log('Err: '+err);
        }
        else{
          res.render('upload',{item : item, url :'/'});
        }
      });
    }
  });

  app.post('/upload', function(request, response){
    // console.log('Path: '+request.files.file.path);
    // console.log("Name : "+request.body.name);
    // console.log("Name : "+request.body.value);

    fs.writeFile("output/"+request.body.name, request.body.value, function(err){
      if(err)
        console.log(err);
    });
    
    console.log('Path: '+request.files.file.path);
    var path = request.files.file.path;
    var type = request.files.file.type;
    console.log('Name:'+request.files.file.name);
    console.log('Type: '+type);

    var dirName = createDirectoryname(request.session.email);
    console.log('User dir name: '+dirName);

    fs.exists('output/'+dirName, function (exists) {
      if(!exists){
        fs.mkdirSync('output/'+dirName);
        console.log("Didn't exist, but now created");
      }
    });
    if(type == 'application/zip'){
      fs.createReadStream(request.files.file.path).pipe(unzip.Extract({ path: 'output/'+dirName }));
    }
    else{
      fs.createReadStream(request.files.file.path).pipe({path: 'output/'+dirName});
    }

    var file = getDirectoryName(request.files.file.name);
    var dir = __dirname+'/output/'+dirName+'/'+file;

    var userId = request.session.userId;
    var i = 0;
    fs.readdir('output/'+dirName, function(err,list){
      if (err){
        console.log('Err :'+err);
      }
      else{
        list.forEach(function(item){
          i++;
          console.log((i)+')'+item);
        });
        console.log("Total Dirs: "+ (i+1));
        var count = i+1;
        DB.addAccountDetails({
          count  : count,
          userId : userId 
        },
          function(err){
            console.log('Error in adding number '+err);
        });
      }
    });
    response.end();

  });

  function getDirectoryName(file) {
      var i = file.lastIndexOf('.');
      return (i < 0) ? '' : file.substr(0,i);
  }

  function createDirectoryname(email){
    var i = email.lastIndexOf('@');
    return (i < 0) ? '' : email.substr(0,i);
  }
}