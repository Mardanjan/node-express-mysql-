var mysql = require('mysql');
var config = require('./config');

var db = mysql.createPool({
	host: config.httpUrl,
	port: config.httpPort,
	user: config.httpUser,
	password: config.httpPsw,
	database: config.dbName
});

module.exports = db;