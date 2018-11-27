var http = require('http');
var url  = require('url');
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://doublechi123:doublechi123@ds149682.mlab.com:49682/chi94';  // use your mlab database

var server = http.createServer(function (req,res) {
	console.log("INCOMING REQUEST: " + req.method + " " + req.url);

	var parsedURL = url.parse(req.url,true); //true to get query as object
	var queryAsObject = parsedURL.query;

	switch(parsedURL.pathname) {
		case '/read':
			var max = (queryAsObject.max) ? Number(queryAsObject.max) : 20;
			console.log('/read max = ' + max);			
			read_n_print(res,{},max);
			break;
		default:
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Not Found\n");
			res.end();
	}
});	

app = express();
app.set('view engine','ejs');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

var users = new Array(
	{name: 'demo', password: ''},
	{name: 'guest', password: 'guest'}
);


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
		res.redirect('/read');;
	}
});

app.get('/read',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('restaurants',{name:req.session.username});
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

app.get('/create',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('create',{name:req.session.username});
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
		db.close();
		});
	res.redirect('/');
});
	
function read_n_print(res,criteria,max) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		findRestaurants(db,criteria,max,function(restaurant) {
			db.close();
			console.log('Disconnected MongoDB\n');
			if (restaurant.length == 0) {
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.end('Not found!');
			} else {
				res.writeHead(200, {"Content-Type": "text/html"});			
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body><H1>Restaurants</H1>');
				res.write('<H2>Showing '+restaurants.length+' document(s)</H2>');
				res.write('<ol>');
				for (var i in restaurant) {
					res.write('<li>'+restaurant[i].name+'</li>');
				}
				res.write('</ol>');
				res.end('</body></html>');
				return(restaurant);
			}
		}); 
	});
}

function findRestaurants(db,criteria,max,callback) {
	var restaurant = [];
	if (max > 0) {
		cursor = db.collection('restaurants').find(criteria).limit(max); 		
	} else {
		cursor = db.collection('restaurants').find(criteria); 				
	}
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurant.push(doc);
		} else {
			callback(restaurant); 
		}
	});
}

app.listen(process.env.PORT || 8099);

