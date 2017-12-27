const express = require('express');

module.exports = function () {
	var router = express.Router();
	router.get('',function (req,res) {
		res.send('欢迎来到我的前端页面')
	});
	return router;
};