var fs = require('fs-extra');
var unzip = require('unzip');

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
          req.session.name = data.username;
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
  });

  app.get('/dashboard', function(req,res){
    res.render('dashboard');
  });

  app.get('/upload', function(req,res){
    if (req.session.email == null){
      res.redirect('/login');
    }
    else{
      console.log('Before Renderinh home, User Id :'+req.session.userId);
      DB.getAccountDetailsByUserId(req.session.userId, function(err,item){
        if(err){
          console.log('Err: '+err);
        }
        else{
          res.render('upload',{item : item});
        }
      });
    }
  });

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
      res.render('user',{item : item});
    });
  });

  app.post('/editName', function(req, res){
    DB.editAccountNames(req.session.email, 
      {fname  : req.param('fname'),
      lname  : req.param('lname'),},
      function(err){
        if(err)
          console.log("Error: "+err);
      }
    )
    res.redirect('/account');
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

  app.post('/upload', function(request, response){
    console.log('Path: '+request.files.file.path);
    var path = request.files.file.path;
    var type = request.files.file.type;
    console.log('Name:'+request.files.file.name);
    console.log('Type: '+type);
    if(type != 'application/zip'){
      response.render('upload');
      console.log('NOT ZIP');
      response.end();
    }
    else{
      console.log('Its a ZIP');
      var dirName = request.session.name;

      fs.exists('output/'+dirName, function (exists) {
        if(!exists){
          fs.mkdirSync('output/'+dirName);
          console.log("Didn't exist, but now created");
        }
      });
      fs.createReadStream(request.files.file.path).pipe(unzip.Extract({ path: 'output/'+dirName }));

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
    }
  });

  function getDirectoryName(file) {
      var i = file.lastIndexOf('.');
      return (i < 0) ? '' : file.substr(0,i);
  }
}