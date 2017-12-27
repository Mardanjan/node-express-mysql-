const express = require('express');
const expressStatic = require('express-static');
// // 消息体解析中间件，但是这个中间件不会解析multipart body,由于这种消息体很复杂而且也很大。
// // 这种multipart的消息体可以用multer,formidable等来完成
const bodyParser = require('body-parser');
const multer = require('multer');
const multerObj = multer({dest:'./static/upload'});
// 解释Cookie的工具。通过req.cookies可以取到传过来的cookie，并把它们转成对象。
const cookieParser = require('cookie-parser');
// 使用cookie来保存session值
const cookieSession = require('cookie-session');
// 各种模板引擎的结合体,包括了jade和ejs。通过配置就可以使用多种模板引擎
const consolidate = require('consolidate');
// 模板引擎
const ejs = require('ejs');

//创建服务器
var server = express();
server.listen(8081);


//解析请求数据

server.use(bodyParser.urlencoded({extended:false}));
server.use(multerObj.any());

//设置cookie，session
server.use(cookieParser('tao_signed'));
(function () {
    var arr = [];
    for(var i = 0;i<10000;i++){
        arr.push('keys_'+Math.random());
    }
    server.use(cookieSession({
        name:'session_id',
        keys:arr,
        maxAge:20*60*1000
    }))
})();

//设置模板
server.set('view engine','html');
server.set('views','./views');
server.engine('html',consolidate.ejs);
//设置路由
server.use('/admin',require('./router/admin/index')());
server.use('/',require('./router/web/index')());


//静态文件的请求
server.use('/files',expressStatic('./static'));