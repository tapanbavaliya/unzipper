var fs = require('fs-extra');
var unzip = require('unzip');

var DB = require('./models/db-handle');

module.exports = function(app) {

// main login page //

  app.get('/', function(req,res){
    if(req.session.email != null)
    {
      res.render('upload');
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
          req.session.name = data.username;
          req.session.userId = data._id;
          // req.session.userId = data._id;
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

  app.get('/register', function(req, res){
    if(req.session.email != null)
    {
      res.render('upload');
    }
    else
    {
      res.render('register');
    }
  });

  app.post('/register', function(req, res){
    console.log("Password:"+req.param('pass'));
    DB.addNewAccount({
      uname  : req.param('uname'),
      fname  : req.param('fname'),
      lname  : req.param('lname'),
      email : req.param('email'),
      pass  : req.param('pass'),
      plan : req.param('plan')
    }, function(err){
      if (err){
        res.send(err, 400);
      } else{
        res.send('A/c created', 200);
      }
    });

    // DB.addAccountDetails({

    // });
  });

  app.get('/dashboard', function(req,res){
    res.render('dashboard');
  });

  app.get('/upload', function(req,res){
    if (req.session.email == null){
      res.redirect('/login');
    }
    else{
      res.render('upload');
    }
  });

  app.post('/upload', function(request, response){
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
      var dirName = request.session.name;
      fs.createReadStream(request.files.fileName.path).pipe(unzip.Extract({ path: 'output/'+dirName }));

      var file = getDirectoryName(request.files.fileName.name);
      var dir = __dirname+'/output/'+dirName+'/'+file;
      // fs.copySync(dir+'/', __dirname+'/test');
      // fs.removeSync(dir+'/*');
      // fs.removeSync(dir);

      // var userId = request.session.userId;

      // DB.addAccountDetails();
      response.end();
    }
  });

  function getDirectoryName(filename) {
      var i = filename.lastIndexOf('.');
      return (i < 0) ? '' : filename.substr(0,i);
  }
}