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
		case '/searchbyid':
		case '/search':
			var criteria = {};
			for (key in queryAsObject) {
				criteria[key] = queryAsObject[key];
			}
			console.log('/search criteria = '+JSON.stringify(criteria));
			read_n_print(res,criteria,0);
			break;
		case '/create':
			console.log('/Create qsp = ' + JSON.stringify(queryAsObject));
			create(res,queryAsObject);
			break;
		case '/delete':
			var criteria = {};
			for (key in queryAsObject) {
				criteria[key] = queryAsObject[key];
			}
			console.log('/delete criteria = '+JSON.stringify(criteria));			
			remove(res,criteria); 
			break;
		case '/borough':
			searchbyborough(res);
			break;
		case '/update':
			res.writeHead(500, {"Content-Type": "text/plain"});
			res.write(parsedURL.pathname + " not available yet\n");
			res.end();
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

function searchbyborough(res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(null, err);
		findDistinctBorough(db, function(boroughs) {
			db.close();
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write("<html><body>");
			res.write("<form action=\"/search\" method=\"get\">");
			res.write("Borough: ");
			res.write("<select name=\"borough\">");
			for (i in boroughs) {
				res.write("<option value=\"" +
					boroughs[i] + "\">" + boroughs[i] + "</option>");
			}
			res.write("</select>");
			res.write("<input type=\"submit\" value=\"Search\">");
			res.write("</form>");
			res.write("</body></html>");
			res.end();
			/*
			console.log(today.toTimeString() + " " + "CLOSED CONNECTION "
							+ req.connection.remoteAddress);
			*/
		});
 	});
}

function create(res,queryAsObject) {
	var new_r = {};	// document to be inserted
	if (queryAsObject.id) new_r['id'] = queryAsObject.id;
	if (queryAsObject.name) new_r['name'] = queryAsObject.name;
	if (queryAsObject.borough) new_r['borough'] = queryAsObject.borough;
	if (queryAsObject.cuisine) new_r['cuisine'] = queryAsObject.cuisine;
	if (queryAsObject.building || queryAsObject.street) {
		var address = {};
		if (queryAsObject.building) address['building'] = queryAsObject.building;
		if (queryAsObject.street) address['street'] = queryAsObject.street;
		new_r['address'] = address;
	}

	console.log('About to insert: ' + JSON.stringify(new_r));

	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		insertRestaurant(db,new_r,function(result) {
			db.close();
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.write(JSON.stringify(new_r));
			res.end("\ninsert was successful!");			
		});
	});
}

function remove(res,criteria) {
	console.log('About to delete ' + JSON.stringify(criteria));
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		deleteRestaurant(db,criteria,function(result) {
			db.close();
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.end("delete was successful!");			
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

function insertRestaurant(db,r,callback) {
	db.collection('restaurant').insertOne(r,function(err,result) {
		assert.equal(err,null);
		console.log("Insert was successful!");
		console.log(JSON.stringify(result));
		callback(result);
	});
}

function deleteRestaurant(db,criteria,callback) {
	db.collection('restaurant').deleteMany(criteria,function(err,result) {
		assert.equal(err,null);
		console.log("Delete was successfully");
		callback(result);
	});
}

function findDistinctBorough(db,callback) {
	db.collection('restaurant').distinct("borough", function(err,result) {
		console.log(result);
		callback(result);
	});
}
app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/search',function(req,res) {
 			var max = (queryAsObject.max) ? Number(queryAsObject.max) : 20;
			console.log('/search max = ' + max);			
			read_n_print(res,{},max);
});


app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.redirect('/read',{name:req.session.username});
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

