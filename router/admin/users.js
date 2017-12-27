const express = require('express');
const db = require('./../../lib/db');
const fs = require('fs');
const pathLib = require('path');
var nodemailer = require('nodemailer'); 

var transporter = nodemailer.createTransport({  
  service: 'qq',  
  auth: {  
    user: '*********@qq.com',  
    pass: '*********'  
  }  
});  

module.exports = function () {
	var router = express.Router();

    router.get('/', function (req, res) {
        switch (req.query.action) {
            case 'del'://删除操作
                db.query('SELECT * FROM user_table WHERE id="' + req.query.id + '"', function (err, queryData) {
                    if (err) {
                        console.error(err);
                        res.status(500).send({code: 500, msg: 'database error'});
                    } else if (queryData.length == 0) {
                        res.status(400).send({code: 400, msg: 'parameters error'});
                    } else {                                
                        fs.unlink(queryData[0].pic_header.replace('\/files','static'), function (err) {
                            if (err) {
                                console.error(err);
                                res.status(500).send({code:500,msg:'operate err'});
                            } else {
                                db.query('DELETE FROM user_table WHERE id="'+
                                    req.query.id+'"',function (err,resultData) {
                                    if(err){
                                        console.error(err);
                                        res.status(500).send({code: 500, msg: 'database error'});
                                    }else{
                                    	db.query('DELETE FROM admin_table WHERE username="'+queryData[0].username+'"', function (err, resultDel) {
                                    		if (err) {
                                    			console.error(err);
                                    			res.status(500).send({code: 500, msg: 'database error'});
                                    		}else{
                                    			res.redirect('/admin/users');
                                    		}
                                    	})
                                    }
                                })
                            }
                        })
                    }
                });
                break;
            case 'mod':
                db.query('SELECT * FROM user_table',function (err,allData) {
                    if (err) {
                        console.error(err);
                        res.status(500).send({code: 500, msg: 'database error'});
                    } else {
                        db.query('SELECT * FROM user_table WHERE id="'+req.query.id+'"',function (err,modData) {
                            if (err) {
                                console.error(err);
                                res.status(500).send({code: 500, msg: 'database error'});
                            }else if(modData.length == 0){
                                res.status(400).send({code: 400, msg: 'parameters error'});
                            }else {
                                res.render('admin/users.ejs',{usersData:allData,modData:modData});
                            }
                        });
                    }
                });
                break;
            case 'email':
                db.query('SELECT * FROM user_table WHERE id="'+req.query.id+'"', function (err, perData) {
                    if (err) {
                        console.error(err);
                        res.status(500).send({code:500, msg: 'database error'});
                    }else if(perData.length == 0) {
                        res.status(400).send({code: 400, msg: 'parameters error'});
                    }else{
                        var mailOptions = {  
                            from: '*********@qq.com', // 发送者  
                            to: perData[0].email, // 接受者,可以同时发送多个,以逗号隔开  
                            subject: '后台管理账号发送', // 标题 
                            html: `<h2>您的后台管理账号为:</h2><h3>用户名：`+perData[0].username+`</h3><h3 style="color:red;">密码：`+perData[0].password+`</h3><h3>网址：http://192.168.50.101:8081/admin</h3>`,
                            attachments: [{
                                filename: '有毒.jpg',
                                path: 'static/upload/6c01fc5cf2939b7d13ea5e89b7cfd991.jpg'
                            }]
                        };
                        transporter.sendMail(mailOptions, function (err, info) {
                            if (err) {
                                console.error(err);
                                res.status(500).send({code:500, msg: '发送失败'});
                            }else{
                                res.redirect('/admin/users');
                            }
                        })  
                    }
                });
                break;
            default:
                db.query('SELECT * FROM user_table', function (err, allUsersData) {
                    if (err) {
                        console.error(err);
                        res.status(500).send({code: 500, msg: 'database error'});
                    } else {
                        res.render('admin/users.ejs', {usersData: allUsersData});
                    }
                });
        }
    });

    router.post('/', function (req, res) {
    	var username = req.body.username;
    	var email = req.body.email;
    	var password = req.body.password;
    	if(req.files.length>0){
            var ext = pathLib.parse(req.files[0].originalname).ext;
            var pic_header = '/files/upload/' + req.files[0].filename + ext;
        }
        if (req.body.modified) {
        	// 判断是否有新传入头像
        	if (req.files.length>0) {
        		db.query('SELECT * FROM user_table WHERE id="'+req.body.modified+'"', function (err,modData) {
        			if (err) {
        				console.error(err);
        				res.status(500).send({code:500, msg:'database error'})
        			}else if (modData.length == 0){
        				res.status(400).send({code: 400, msg: 'parameters error'});
        			}else{
        				fs.unlink(modData[0].pic_header.replace('\/files','static'), function (err) {
        					if (err) {
        						console.error(err)
        						res.status(500).send({code: 500, msg: 'database error'});
        					} else {
        						//删除成功，开始对新的文件进行重命名
        						fs.rename(req.files[0].path, req.files[0].path + ext, function (err) {
        							if (err) {
        								console.error(err)
        								res.status(500).send({code: 500, msg: 'data error'});
        							} else {
        								db.query('UPDATE user_table SET email="'+email+'",password="'+password+'",pic_header="'+pic_header+'" WHERE id="'+req.body.modified+'"', function (err, data) {
        									if (err) {
        										console.error(err)
        										res.status(500).send({code:500, msg:'database error'})
        									}else{
        										db.query('UPDATE admin_table SET password="'+password+'" WHERE username="'+username+'"',function(err,rdata){
        											console.log(data,rdata);
        											if (err) {
        												console.error(err)
        												res.status(500).send({code:500, msg:'database error'})
        											} else{
        												res.redirect('/admin/users');
        											}
        										})
        									}
        								})
        							}
        						})
        					}
        				})
        			}
        		})
        	}else{
        		db.query('UPDATE user_table SET email="'+email+'",password="'+password+'" WHERE id="'+req.body.modified+'"', function (err, data) {
					if (err) {
						console.error(err)
						res.status(500).send({code:500, msg:'database error'})
					}else{
						db.query('UPDATE admin_table SET password="'+password+'" WHERE username="'+username+'"',function(err,rdata){
							if (err) {
								console.error(err)
								res.status(500).send({code:500, msg:'database error'})
							} else{
								res.redirect('/admin/users');
							}
						})
					}
				})
        	}
        }else{
        	// 对传入文件重命名
        	fs.rename(req.files[0].path, req.files[0].path + ext, function (err) {
        		if (err) {
        			console.error(err);
        			res.status(500).send({code: 500, msg: 'data error'});
        		}else{
        			db.query('SELECT id FROM admin_table WHERE username="'+username+'"', function (err, result) {
        				if (err) {
        					console.error(err);
        					res.status(500).send({code:500, msg:'database error'})
        				}else if(result.length != 0) {
        					res.status(400).send({code: 400, msg: 'username repeat'});
        				}else{
        					db.query('INSERT INTO user_table (username, email, pic_header, password)  VALUE ("'+username+'", "'+email+'", "'+pic_header+'", "'+password+'")', function (err, resultData) {
        						if (err) {
        							console.error(err);
        							res.status(500).send({code:500, msg:'database error'})
        						}else{
        							db.query('INSERT INTO admin_table (username, password) VALUE ("'+username+'", "'+password+'")', function (err, adminResult) {
        								if (err) {
        									console.error(err);
        									res.status(500).send({code:500, msg:'database error'})
        								} else {
        									res.redirect('/admin/users');
        								}
        							})
        						}
        					})
        				}
        			})
        			
        		}
        	})
        }
    });
    return router;
}
