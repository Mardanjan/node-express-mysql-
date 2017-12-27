const express = require('express');
const db = require('./../../lib/db');

module.exports = function () {
  var router = express.Router();
  router.get('/', function (req,res) {
  	res.render('admin/login.ejs');
  });
  router.post('/', function (req,res) {
  	var username = req.body.username;
  	var password = req.body.password;
  	if (username && password) {
  		db.query('SELECT * FROM admin_table WHERE username="'+username+'"',function (err,userData) {
  			if (err) {
  				console.log(err);
  				res.status(500).send({
  					code:500,
  					data:[],
  					msg:'database error'
  				});
  			}else if(userData.length == 0) {
  				res.status(400).send({
  					code:400,
  					data:[],
  					msg:'parameters error'
  				});
  			}else{
  				if (userData[0].password == password) {
  					req.session['user_id'] = userData[0].id;
  					res.status(200).send({
  						code:200,
  					    data:[],
  					    msg:'success'
  					});
  				}else{
  					res.status(400).send({
  						code:400,
  					    data:[],
  					    msg:'username or password error'
  					});
  				}
  			}
  		})
  	} else {
  		res.status(400).send({
			code:400,
			data:[],
			msg:'parameters error'
		});
  	}
  });
  return router;
};