module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
		console.log('Inside Router Path  :'+ __dirname);
		res.render('upload');
	});
}