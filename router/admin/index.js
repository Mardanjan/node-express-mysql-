const express = require('express');
const db = require('./../../lib/db');
var nodeExcel = require('excel-export');
var XLSX = require('xlsx');
var Busboy = require('busboy');


module.exports = function () {
    var router = express.Router();
    // 路由
    router.use(function (req,res,next) {
        if(!req.session['user_id'] && req.url != '/login'){
            res.redirect('/admin/login');
        }else{
            next();
        }
    });
    router.use('/login',require('./login')());
    router.use('/users',require('./users')());

    router.get('/', function (req, res) {
    	var current_page = 1; //默认为1
        var num = 10; //一页条数
        if (req.query.page) {
	      current_page = parseInt(req.query.page);
	    }
        switch (req.query.action) {
            case 'del':
                //删除操作
                db.query('DELETE FROM blog_list_table WHERE id="'+req.query.id+'"',function (err,resultData) {
                    if(err){
                        console.error(err);
                        res.status(500).send({code:500,msg:'database error'});
                    }else{
                        res.redirect('/admin');
                    }
                });
                break;
            case 'mod':
                //修改操作
                db.query('SELECT * FROM blog_list_table WHERE id="'+req.query.id+'"',function (err,modData) {
                    if(err){
                        console.error(err);
                        res.status(500).send({code:500,msg:'database error'});
                    }else if(modData.length == 0){
                        res.status(400).send({code:400,msg:'parameters error'});
                    }else{
                        db.query('SELECT * FROM blog_list_table limit ' + num + ' offset ' + num * (current_page - 1), function (err, allData, fields) {
		                    if (err) {
		                        console.error(err);
		                        res.status(500).send({code: 500, msg: 'database error'}).end();
		                    } else {
		                    	db.query('SELECT COUNT(*) FROM blog_list_table', function (err, result) {
		                    		if (err) {
		                    			console.log(err);
		                    			res.status(500).send({code:500, msg:'database error'}).end();
		                    		}else{
		                    			var allCount = result[0]['COUNT(*)'];
						                var allPage = parseInt(allCount)/num;
						                var pageStr = allPage.toString();
						                // 不能被整除
						                if (pageStr.indexOf('.')>0) {
						                    allPage = parseInt(pageStr.split('.')[0]) + 1; 
						                }
						                res.render('admin/index.ejs', {
				                        	totalCount:allCount,
				                        	totalPages:allPage,
				                        	currentPage:current_page,
				                            formData: allData,
				                            modData:modData
				                        });
		                    		}
		                    	});
		                    }
		                });
                    }
                });
                break;
            case 'export':
                db.query('SELECT code,name,price,category,unit,brand FROM blog_list_table', function (err,exportData) {
                    if (err) {
                        console.error(err);
                        res.status(500).send({code: 500, msg: 'database error'}).end();
                    }else{
                        // excel-export 导出代码
                        var headers = [{caption:'条码',type:'string'},{caption:'商品名',type:'string'},{caption:'价格',type:'string'},{caption:'品类',type:'string'},{caption:'单位',type:'string'},{caption:'品牌',type:'string'}];
                        var conf = {};
                        var rows=[];
                        conf.stylesXmlFile = "styles.xml";
                        conf.cols = [];
                        for (var i = 0; i < headers.length; i++) {
                            var col = {};
                            col.caption = headers[i].caption;
                            col.type = headers[i].type;
                            conf.cols.push(col);
                        };
                        for (var i = 0; i < exportData.length; i++) {
                            rows.push(Array.from(exportData[i]))
                        };
                        console.log(rows);
                        conf.rows = rows;
                        var result = nodeExcel.execute(conf);
                        res.setHeader('Content-Type','application/vnd.openxmlformats');
                        res.setHeader('Content-Disposition','attachment; filename='+'report.xlsx');
                        res.end(result,'binary');
                    }
                })
                break;
            default:
                db.query('SELECT * FROM blog_list_table limit ' + num + ' offset ' + num * (current_page - 1), function (err, resultData, fields) {
                    if (err) {
                        console.error(err);
                        res.status(500).send({code: 500, msg: 'database error'}).end();
                    } else {
                    	db.query('SELECT COUNT(*) FROM blog_list_table', function (err, result) {
                    		if (err) {
                    			console.log(err);
                    			res.status(500).send({code:500, msg:'database error'}).end();
                    		}else{
                    			var allCount = result[0]['COUNT(*)'];
				                var allPage = parseInt(allCount)/num;
				                var pageStr = allPage.toString();
				                // 不能被整除
				                if (pageStr.indexOf('.')>0) {
				                    allPage = parseInt(pageStr.split('.')[0]) + 1; 
				                }
				                res.render('admin/index.ejs', {
		                        	totalCount:allCount,
		                        	totalPages:allPage,
		                        	currentPage:current_page,
		                            formData: resultData
		                        });
                    		}
                    	});
                    }
                });
        }
    });

    router.post('/', function (req, res) {
    	var code = req.body.code.trim();
    	var name = req.body.name.trim();
    	var price = req.body.price.trim();
    	var category = req.body.category.trim();
    	var brand = req.body.brand.trim();
    	var unit = req.body.unit.trim();
    	if (code) {
    		if (req.body.modified) {
    			db.query('UPDATE blog_list_table SET code="'+code+'",name="'+name+'",price="'+price+'",category="'+category+'",brand="'+brand+'",unit="'+unit+'" WHERE id="'+req.body.modified+'"', function (err,resultData) {
    				if (err) {
    					console.error(err);
    					res.status(500).send({code: 500, msg: 'database error'}).end();
    				}else{
    					res.redirect('/admin');
    				}
    			})
    		}else{
    			db.query('INSERT INTO blog_list_table (code,name,price,category,brand,unit) VALUE ("'+code+'", "'+name+'", "'+price+'", "'+category+'", "'+brand+'", "'+unit+'")', function (err,resultData) {
    				if (err) {
    					console.error(err);
    					res.status(500).send({code: 500, msg: 'database error'}).end();
    				}else{
    					res.redirect('/admin');
    				}
    			})
    		}
    	} else {
    		res.status(400).send({code: 400, msg: 'database error'}).end() ;
    	}
    });

    router.post('/import',function(req, res) {
        var busboy = new Busboy({ 
            headers: req.headers,
            limits: {
                files: 1
            }
        });
        console.log(req.files[0]);
        file = req.files[0];
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            console.log(9090)
            file.on('data', function(data) {
                console.log('File['+fieldname+']got'+data.length+'bytes');
                var workbook = XLSX.read(data);
                var sheetNames = workbook.SheetNames;
                var worksheet = workbook.Sheets[sheetNames[0]];
                var ref = worksheet['!ref'];
                var reg = /[a-zA-Z]/g;
                ref = ref.replace(reg,"");
                var line = parseInt(ref.split(':')[1]);//获取excel的有效行数
                console.log("line——》",line);

                for(var i = 2;i<=line;i++){
                    if (!worksheet['A'+i] && !worksheet['B'+i] && !worksheet['C'+i] && !worksheet['D'+i] && !worksheet['E'+i] && !worksheet['F'+i]) {
                        break;
                    };
                    var code_in = worksheet['A'+i].v || '';
                    var name_in = worksheet['B'+i].v || '';
                    var price_in = worksheet['C'+i].v || '';
                    var category_in = worksheet['D'+i].v || '';
                    var unit_in = worksheet['E'+i].v || '';
                    var brand_in = worksheet['F'+i].v || '';
                    db.query('INSERT INTO blog_list_table (code,name,price,category,brand,unit) VALUE ("'+code_in+'", "'+name_in+'", "'+price_in+'", "'+category_in+'", "'+brand_in+'", "'+unit_in+'")',function (err, res) {
                        if (err) {
                            console.error(err);
                            res.status(500).send({code: 500, msg: 'database error'}).end();
                        }
                    })
                }
            });
        });
        req.pipe(busboy);

        // res.redirect('/admin');

    });
    return router;
};