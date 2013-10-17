var fs = require('fs-extra');
var unzip = require('unzip');

var DB = require('./models/db-handle');

module.exports = function(app) {

// main login page //


  app.get('/', function(req, res){

    if (req.cookies.user == undefined || req.cookies.pass == undefined){
      res.render('login', { title: 'Login' });
    }
    else{
      DB.autoLogin(req.cookies.user, req.cookies.pass, function(data){
        if (data != null){
            req.session.user = data;
          res.redirect('/upload');
        }
        else{
          res.render('login', { title: 'Login' });
        }
      });
    }
  });

  app.post('/', function(req, res){
    DB.manualLogin(req.param('user'), req.param('pass'), function(err, data){
      if (!data){
        res.send(err, 400);
      } else{
          req.session.user = data;
        if (req.param('remember-me') == 'true'){
          res.cookie('user', data.user, { maxAge: 900000 });
          res.cookie('pass', data.pass, { maxAge: 900000 });
        }
        res.send(data, 200);
      }
    });
  });

  // app.get('/', function(req, res){
  //   res.render('upload');
  // });

  app.get('/login', function(req, res){
    res.render('login');
  });

  app.get('/register', function(req, res){
    res.render('register');
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
        // .on('error', function (err) { console.log('error', err); })
        // .on('close', function () { console.log('closed'); });

        var file = getDirectoryName(request.files.fileName.name);
        console.log('File:'+file);
        fs.mkdirsSync('output/user');
        var main = __dirname+'/output';
        console.log(main);

        var dir = __dirname+'/output/'+file;
        console.log('Dir: '+dir+'/*');

        //fs.copy(dir+'/', __dirname+'/test', function(err){
      //   if (err) return console.error(err);
      //   console.log('success!')
      // });

      fs.copySync(dir+'/', __dirname+'/test');

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