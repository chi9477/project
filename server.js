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
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurants").find().toArray(function(err,items){
		res.render('restaurants',{name:req.session.username, r:items});
			});
        	});									
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
		
		db.collection('restaurants').insertOne({
			    "name": req.body.name,
			    "borough": req.body.borough,
			    "cuisine": req.body.cuisine,
			    "photo": "no.jpg",
			    "photo mimetype": "KASDKJ",
			    "street": req.body.street,
			    "building": req.body.building,
			    "zipcode": req.body.zipcode,
			    "gps1": req.body.gps1,
			    "gps2": req.body.gps2,
			    "owner":req.session.username
			});
		});
	res.redirect('/');
});
	
app.get('/showdetails', function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurants").find().toArray(function(err,items){
		var item = null;
		var rest = null;
		var rn = null;
		if (req.query.id) {
		for (i in items) {
			if (items[i]._id == req.query.id) {
				item = items[i];
				rn = items[i].name;
				break;
			}
		}
		if (item) {
			db.collection("grades").find({rname: rn}).toArray(function(err,rnames){
					res.render('details', {r: items[i], g: rnames});
			});
		} else {
			res.status(500).end(req.query.id + ' not found!');
		}
		} else {
			res.status(500).end('id missing!');
		}
			});
		});
	}
});

app.get('/edit',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurants").find().toArray(function(err,items){
		var item = null;
		var owner = null;
		if (req.query.id) {
			for (i in items) {
				if (items[i]._id == req.query.id) {
					item = items[i];
					owner = items[i].owner;
					break;
				}
			}	     
			if (item) {
				if(req.session.username == owner) {
					res.render('update', {r: items[i]});
				} else {
					res.render('cantupdate');
				}
			} else {
				res.status(500).end(req.query.id + ' not found!');
			}
		
	} else {
		res.status(500).end('id missing!');
	}
				    
			});
		});
	}
});

app.post('/update',function(req,res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
			db.collection('restaurants').update({_id: ObjectId(req.body.id)}, {
			$set: {
			    "name": req.body.name,
			    "borough": req.body.borough,
			    "cuisine": req.body.cuisine,
			    "photo": "no.jpg",
			    "photo mimetype": "KASDKJ",
			    "street": req.body.street,
			    "building": req.body.building,
			    "zipcode": req.body.zipcode,
			    "gps1": req.body.gps1,
			    "gps2": req.body.gps2
			}
		});	
	});
	res.redirect('/');
});

app.get('/remove',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurants").find().toArray(function(err,items){
		var item = null;
		var owner = null;
		if (req.query.id) {
			for (i in items) {
				if (items[i]._id == req.query.id) {
					item = items[i];
					owner = items[i].owner;
					break;
				}
			}	     
			if (item) {
				if(req.session.username == owner) {
					db.collection('restaurants').remove({_id: ObjectId(req.query.id)}, {
		});
					res.render('deletesuccess', {r: items[i]});
				} else {
					res.render('deletefail');
				}
			} else {
				res.status(500).end(req.query.id + ' not found!');
			}
		
	} else {
		res.status(500).end('id missing!');
	}
				    
			});
		});
	}
});

app.post('/read',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurants").find({$or:[
			{name:req.body.search}, 
			{borough:req.body.search}, 
			{cuisine:req.body.search}, 
			{street:req.body.search}, 
		 	{building:req.body.search}, 
			{zipcode:req.body.search}, 
			{gps1:req.body.search}, 
			{gps2:req.body.search}, 
			{owner:req.body.search}]}).toArray(function(err,items){
				res.render('restaurants',{name:req.session.username, r:items});
			});
        	});									
	}
});

app.get('/rate',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurants").find().toArray(function(err,items){
		var item = null;
		if (req.query.id) {
			for (i in items) {
				if (items[i]._id == req.query.id) {
					item = items[i]
					break;
				}
			}	     
			if (item) {
				res.render('rating', {r: items[i]});
			} else {
				res.status(500).end(req.query.id + ' not found!');
			}
		
	} else {
		res.status(500).end('id missing!');
	}		    
			});
		});
	}
});

app.post('/rate',function(req,res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		db.collection('grades').find().toArray(function(err,mark){
			for (i in mark) {
		if (mark[i].r_id != req.body.id) {
			db.collection('grades').insertOne({
					"r_id": req.body.id,
					"rname": req.body.name,
			    		"user": req.session.username,     
			    		"score": req.body.score
			});
			res.redirect('/');
		} else {
			res.render('cantrate');
		}
			}
		});
	});
});

app.listen(process.env.PORT || 8099);
