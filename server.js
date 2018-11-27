var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://doublechi123:doublechi123@ds149682.mlab.com:49682/chi94';  // use your mlab database



 
app = express();
app.set('view engine','ejs');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

var users = new Array(
	{name: 'demo', password: ''},
	{name: 'guest', password: 'guest'}
);

function read_n_print(res,criteria,max) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		findRestaurants(db,criteria,max,function(restaurants) {
			db.close();
			console.log('Disconnected MongoDB\n');
			if (restaurants.length == 0) {
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.end('Not found!');
			} else {
				res.writeHead(200, {"Content-Type": "text/html"});			
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body><H1>Restaurants</H1>');
				res.write('<H2>Showing '+restaurants.length+' document(s)</H2>');
				res.write('<ol>');
				for (var i in restaurants) {
					res.write('<li>'+restaurants[i].name+'</li>');
				}
				res.write('</ol>');
				res.end('</body></html>');
				return(restaurants);
			}
		}); 
	});
}

function findRestaurants(db,criteria,max,callback) {
	var restaurants = [];
	if (max > 0) {
		cursor = db.collection('restaurants').find(criteria).limit(max); 		
	} else {
		cursor = db.collection('restaurants').find(criteria); 				
	}
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants); 
		}
	});
}

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('restaurants',{name:req.session.username});
	}
});

app.get('/create',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('create',{name:req.session.username});
	}
});

app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/login.html');
});

app.post('/login',function(req,res) {
	for (var i=0; i<users.length; i++) {
		if (users[i].name == req.body.name &&
		    users[i].password == req.body.password) {
			req.session.authenticated = true;
			req.session.username = users[i].name;
		}
	}
	res.redirect('/');
});



app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});

app.get('/restaurants',function(req,res) {
	var criteria = {};
			for (key in queryAsObject) {
				criteria[key] = queryAsObject[key];
			}
			console.log('/restaurants criteria = '+JSON.stringify(criteria));
	
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		
		MongoClient.connect(mongourl, function(err, db) {
			
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		findRestaurants(db,criteria,max,function(restaurants) {
			db.close();
			console.log('Disconnected MongoDB\n');
			if (restaurants.length == 0) {
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.end('Not found!');
			} else {
				res.writeHead(200, {"Content-Type": "text/html"});			
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body><H1>Restaurants</H1>');
				res.write('<H2>Showing '+restaurants.length+' document(s)</H2>');
				res.write('<ol>');
				for (var i in restaurants) {
					res.write('<li>'+restaurants[i].name+'</li>');
				}
				res.write('</ol>');
				res.end('</body></html>');
				return(restaurants);
			}
		}); 
	});
	}
});

app.post('/create',function(req,res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		
		db.collection('restaurants').insertOne( {
			    "name": req.body.name,
			    "borough": req.body.bouough,
			    "cuisine": req.body.cuisine,
			    "photo": "no.jpg",
			    "photo mimetype": "KASDKJ",
			    "address": {
				"street": req.body.street,
				"building": req.body.building,
				"zipcode": req.body.zipcode,
				"gps1": req.body.gps1,
				"gps2": req.body.gps2
			    },
			    "grades": {
				"user": null,
				"score": null
			    },
			    "owner":req.session.username
			});
		});
	res.redirect('/');
});
app.listen(process.env.PORT || 8099);

