var fs = require('fs-extra');
var unzip = require('unzip');

var DB = require('./models/db-handle');

module.exports = function(app) {

// main login page //

  app.get('/', function(req, res){
    console.log("Session:"+req.cookies.email)
    if (req.cookies.email == undefined || req.cookies.pass == undefined){
      res.render('login', { title: 'Login' });
    }
    else{
      DB.autoLogin(req.cookies.email, req.cookies.pass, function(data){
        if (data != null){
          req.session.email = data;
          res.redirect('/upload');
        }
        else{
          res.render('login', { title: 'Login' });
        }
      });
    }
  });

  app.post('/', function(req, res){
    DB.manualLogin(req.param('email'), req.param('pass'), function(err, data){
      console.log('Inside');
      if (!data){
        res.send(err, 400);
      } else{
          req.session.email = data;
        if (req.param('remember-me') == 'true'){
          res.cookie('email', data.email, { maxAge: 900000 });
          res.cookie('pass', data.pass, { maxAge: 900000 });
        }
        // res.send(data, 200);
        res.render('upload');
      }
    });
  });

  app.get('/upload', function(req,res){
    res.render('upload');
  });

  app.get('/', function(req,res){
    res.render('login', { title: 'Login' });
  });

  app.get('/register', function(req, res){
    res.render('register');
  });

  app.post('/register', function(req, res){
    DB.addNewAccount({
      name  : req.param('name'),
      email   : req.param('email'),
      pass  : req.param('pass'),
    }, function(err){
      if (err){
        res.send(err, 400);
      } else{
        res.send('A/c created', 200);
      }
    });
  });

  app.post('/upload', function (request, response){
    console.log('Path: '+request.files.fileName.path);
    var path = request.files.fileName.path;
    var type = request.files.fileName.type;
    console.log('Name:'+request.files.fileName.name);
    console.log('Type: '+type);
    if(type != 'application/zip'){
      response.render('upload');
      console.log('NOT ZIP');
      response.end();
    }
    else{
      console.log('Its a ZIP');

      fs.createReadStream(request.files.fileName.path).pipe(unzip.Extract({ path: 'output/' }));

      var file = getDirectoryName(request.files.fileName.name);
      console.log('File:'+file);
      fs.mkdirsSync('output/user');
      var main = __dirname+'/output';
      console.log(main);

      var dir = __dirname+'/output/'+file;
      // fs.copySync(dir+'/', __dirname+'/test');
      // fs.removeSync(dir+'/*');
      // fs.removeSync(dir);
      response.end();
    }
  });

  function getDirectoryName(filename) {
      var i = filename.lastIndexOf('.');
      return (i < 0) ? '' : filename.substr(0,i);
  }
}