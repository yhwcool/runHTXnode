
var express = require('express');
var bookshelf = require("../../db/DBconfig");
var models = require('../../model/model');
var router = express.Router();
const crypto = require("crypto");
var async = require('async');

var mysql = require("mysql");

var db = require('../../db/db');

// 查询用户
router.post('/queryAll', function (req, res, next) {
    var params = req.body;
    models.User.forge().fetchAll().then(function (user) {
        console.log('status:' + params.status);
        if (params.status != 7) {
            user.query('where', 'status', '<', params.status).fetch().then(function (model) {
                if (model) {
                    res.json({
                        success: true,
                        data: model.models
                    })
                }
            })
        } else {
            res.json({
                success: true,
                data: user.models
            })
        }
    });
});

//用户登陆
router.post('/loginUser', function (req, res, next) {
    debugger;
    models.User.forge({
        account: req.body.account
    }).fetch().then(function (user) {
        if (user) {
            if (user.attributes.password === crypto.createHash("md5").update(req.body.password).digest("hex")) {
                res.json({
                    success: true,
                    data: user,
                    maininfo: {
                        "persionone": 10,
                        "persiontwo": 20,
                        "persionthr": 30
                    }
                })

                // var account = user.attributes.account;
                // models.Persion.query('where', 'persionone', '=', account).fetchAll().then(function (model1) {
                //     return models.Persion.query('where', 'persiontwo', '=', account).fetchAll().then(function (model2) {
                //         return models.Persion.query('where', 'persionthr', '=', account).fetchAll().then(function (model3) {
                //             console.log(model1.models.length);
                //             console.log(model2.models.length);
                //             console.log(model3.models.length);
                //             res.json({
                //                 success: true,
                //                 data: user,
                //                 maininfo: {
                //                     "persionone": model1.models.length,
                //                     "persiontwo": model2.models.length,
                //                     "persionthr": model3.models.length
                //                 }
                //             })
                //         })
                //     })
                // })

            } else {
                res.json({
                    success: false,
                    msg: '密码错误'
                })
            }
        } else {
            res.json({
                success: false,
                msg: '账户不存在，请联系管理员'
            })
        }
    });
});



//用户注册
router.post('/regUser', function (req, res, next) {
    debugger;
    var params = req.body;
    var currentaccount = params.currentaccount;//当前添加的管理员 id
    var currentmoney = params.currentmoney;//当前管理员的钱
    var currentstatus = params.currentstatus;//当前权限 
    var currentaccountid = params.currentaccountid;//当前权限 

    delete params["currentaccount"];
    delete params["currentmoney"];
    delete params["currentstatus"];
    delete params["currentaccountid"];

    params.password = crypto.createHash("md5").update(params.password).digest("hex"); //对密码加密
    params.addtime = new Date().getTime();
    /**
     添加会员的时候 一整个事务
    1.账号，账号不存在(提示：账号不存在，失败)；
    2.密码错误（提示：密码错误）
    3.输入的上级 只要不是润濠 都要查询 这个上级用户是否存在（失败返回）
    4.用户新增 成功之后，需要获取到这个用户的第一个上级，第二个上级，第三个上级，到公司 停下
    5.再相应的关系表中插入 新增这个用户的 关系表
    */

    db.getConnection(function (connection) {
        connection.beginTransaction(function (err) {
            debugger;
            if (err) {
                console.log(err);
                return;
            }
            var task1 = function (callback) { //查询手机号码时候存在
                connection.query(`select * from user where account = '` + params.account + `'`, function (err, result) {
                    debugger;
                    if (result.length > 0) {
                        console.log(err);
                        callback({
                            message: '用户已经存在'
                        }, null);
                        return;
                    }
                    console.log('改手机号没有被注册，可以使用');
                    callback(null, result);
                })
            }
            var task2 = function (callback) {//查询上级时候存在
                if (params.uppersion === "润濠") {
                    console.log('上级属于公司，可以插入');
                    callback(null, null);
                } else {
                    connection.query(`select * from user where account = '` + params.uppersion + `'`, function (err, result) {
                        debugger;
                        if (result.length <= 0) { //没有查询到上级
                            callback({
                                message: '上级不存在'
                            }, null);
                            return;
                        }
                        console.log('上级查询成功!');
                        callback(null, result);
                    })
                }
            }

            var task3 = function (callback) { //插入当前用户
                models.User.forge().save(params).then(function (result) {
                    debugger;
                    if (!result) {
                        callback({
                            message: '插入数据失败,请稍后再试!'
                        }, null);
                        return;
                    }
                    console.log('添加成功');
                    callback(null, result.attributes);
                })
            }
            var task4 = function (callback) { //更新关系表
                debugger;
                var obj = {
                    persionone: params.uppersion, //第一级
                    persiontwo: '',
                    persionthr: ''
                };
                obj.account = params.account;

                if (params.uppersion !== "润濠") {//只要上级不是公司 就要查询
                    let sql = 'SELECT * FROM user  WHERE `account` IN ( "' + params.uppersion + '",' +
                        '(select u.`uppersion` from user u where `account`="' + params.uppersion + '"));'
                    connection.query(sql, function (err, rows) {
                        if (err) {
                            callback({
                                message: '插入数据失败,请稍后再试!'
                            }, null);
                            return;
                        }
                        var arr_1 = rows[0];
                        var arr_2 = rows[1];
                        if (arr_2) {//有两条数据
                            if (arr_1.account === params.uppersion) {
                                obj.persiontwo = rows[0].uppersion;
                                obj.persionthr = rows[1].uppersion;
                            } else {
                                obj.persiontwo = rows[1].uppersion;
                                obj.persionthr = rows[0].uppersion;
                            }
                        } else {
                            obj.persiontwo = rows[0].uppersion;
                        }
                        insetPersion(callback);
                    })
                } else {
                    insetPersion(callback);
                }

                function insetPersion(callback) { //添加关联关系
                    models.Persion.forge().save(obj).then(function (result) {
                        if (!result) {
                            callback({
                                message: '插入数据失败,请稍后再试!'
                            }, null);
                            return;
                        }
                        callback(null, result);
                    })
                }
            };
            async.series([task1, task2, task3, task4], function (err, result) {
                debugger;
                if (err) {
                    console.log(err);
                    //回滚  
                    connection.rollback(function () {
                        res.json({
                            success: false,
                            msg: err.message
                        })
                        connection.release();
                    });
                    return;
                }
                //提交  
                connection.commit(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    res.json({
                        success: true,
                        msg: '添加成功'
                    })
                    //释放资源  
                    connection.release();
                });
            })
        })

        // if (params.uppersion === '润濠') {
        //     params.uppersion = 'admin'
        // }
        // params.addtime = addtime;
        // var obj = {
        //     6: 0,
        //     5: 350,
        //     4: 300,
        //     3: 150
        // }
        // var objfirst = {
        //     1: 600
        // }
        // delete params["currentaccount"];
        // delete params["currentmoney"];
        // delete params["currentstatus"];
        // delete params["currentaccountid"];
        // bookshelf.transaction(function (t) {
        //     debugger;
        //     return models.User.forge({
        //         account: params.account
        //     }).fetch().then(function (user) {
        //         if (user) {
        //             res.json({
        //                 success: false,
        //                 msg: '用户已经存在'
        //             })
        //         } else {
        // models.User.forge().save(params).then(function (reslut) { //保存 录入的数据
        //     console.log('111111111111111111111');
        //     console.log(params.uppersion === '润濠');
        //     if (!reslut) {
        //         throw Error('添加失败');
        //     }
        //     pool.getConnection(function (err, connection) { //保存成功
        //         let sql = 'select * from user where account = "' + params.uppersion + '"'; //查询注册用户的上级
        //         connection.query(sql, function (err, rows_0) {
        //             console.log("22222222222222222222");
        //             console.log("params.uppersion : " + params.uppersion);
        //             console.log(rows_0);
        //             if (rows_0 && rows_0.length > 0) {
        //                 debugger;
        //                 //如果上级存在  关系表中插入 数据
        //                 var obj = {
        //                     persionone: params.uppersion,
        //                     persiontwo: '',
        //                     persionthr: ''
        //                 };
        //                 obj.account = params.account;
        //                 debugger;
        //                 if (params.uppersion !== "admin") {
        //                     let sql = 'SELECT * FROM user  WHERE `account` IN ( "' + params.uppersion + '",' +
        //                         '(select u.`uppersion` from user u where `account`="' + params.uppersion + '"));'
        //                     connection.query(sql, function (err, rows) {
        //                         debugger;
        //                         var rows = rows;
        //                         if (rows) {
        //                             obj.persionthr = rows[0].uppersion;
        //                             obj.persiontwo = rows[1].uppersion;
        //                             insetPersion();
        //                         }
        //                     })
        //                 } else {
        //                     insetPersion();
        //                 }

        //                 function insetPersion() {
        //                     function success(rows) {
        //                         if (rows) {
        //                             debugger;
        //                             res.json({
        //                                 success: true,
        //                                 data: user.attributes,
        //                                 msg: '添加成功'
        //                             })
        //                         }else{
        //                             console.log('errrrrrrrrrrrrorororororororo')
        //                         }
        //                     }
        //                     debugger;
        //                     console.log('obj:' + obj)
        //                     // let sql_insert = 'select * from user where account = ' + params.uppersion;
        //                     models.Persion.forge().save(obj).then(function (result) {
        //                         debugger;
        //                         return models.User.forge({
        //                             account: currentaccount
        //                         }).fetch().then(function (user) {
        //                             if (rows_0[0].status >= 3) { //管理员的流程
        //                                 if (rows_0[0].status == 5) { //如果是市级管理员 自己得300
        //                                     let sql = 'update user set money=' + (rows_0[0].money + 350) + ' where account = "' + rows_0[0].account + '"';
        //                                     connection.query(sql, function (err, rows_5) {
        //                                         console.log('===========5');
        //                                         console.log(rows_5);
        //                                         success(rows_5)
        //                                     })
        //                                 } else if (rows_0[0].status == 4) { //县级管理员 得300，市级得50
        //                                     let sql1 = 'select * from persion where account = "' + rows_0[0].account + '"';  //查询上级代理
        //                                     var arr = [];
        //                                     connection.query(sql1, function (err, rows_4) {
        //                                         if (rows_4.length > 0) {
        //                                             let sql = 'UPDATE USER SET `money` = money + CASE `account`' +
        //                                                 ' WHEN ' + rows_4[0].persionone + ' THEN 50' + //上一级
        //                                                 ' WHEN ' + rows_4[0].account + ' THEN 300' + //自己
        //                                                 ' END' +
        //                                                 ' WHERE `account` IN (' + rows_4[0].persionone + ',' + rows_0[0].account + ')';
        //                                             connection.query(sql, function (err, rows) {
        //                                                 console.log('+++++++++++++++++++444444');
        //                                                 console.log(rows);
        //                                                 success(rows)
        //                                             })
        //                                         }
        //                                     })
        //                                 } else if (rows_0[0].status == 3) { //服务中心管理员 自己200 县级100 市级50
        //                                     let sql1 = 'select * from persion where account = ' + rows_0[0].account  //查询上级代理
        //                                     var arr = [];
        //                                     connection.query(sql1, function (err, rows_3) {
        //                                         if (rows_3.length > 0) {
        //                                             arr.push(rows_3[0].persionone)
        //                                             arr.push(rows_3[0].persiontwo)
        //                                             arr.push(rows_3[0].persionthr);
        //                                             let sql = 'UPDATE USER SET `money` = money + CASE `account`' +
        //                                                 ' WHEN ' + rows_3[0].persionone + ' THEN 100' + //上一级
        //                                                 ' WHEN ' + rows_3[0].persiontwo + ' THEN 50' + //上上一级
        //                                                 ' WHEN ' + rows_0[0].account + ' THEN 200' + //自己
        //                                                 ' END' +
        //                                                 ' WHERE `account` IN (' + rows_3[0].persionone + ',' + rows_3[0].persiontwo + ',' + rows_0[0].account + ')';
        //                                             connection.query(sql, function (err, rows) {
        //                                                 console.log('+++++++++++++++++++333333');
        //                                                 console.log(rows);
        //                                                 success(rows)
        //                                             })
        //                                         }
        //                                     })
        //                                 }
        //                             } else {//普通的直接上级
        //                                 let sql = 'update user set money = money + ' + 600 + ' where account = "' + params.uppersion + '"'; //直接上级
        //                                 connection.query(sql, function (err, rows) {
        //                                     success(rows)
        //                                 })

        //                             }
        //                         })
        //                     })
        //                 }


        // let sql = 'update user set money = money + ' + 600 + ' where account = "' + params.uppersion + '"'; //直接上级
        // connection.query(sql, function (err, rows) {
        //     console.log("3333333333333333333");
        //     console.log(rows);
        //     if (rows && rows.changedRows >= 1) { //修改成功，添加用户
        //         var obj = {
        //             persionone: params.uppersion,
        //             persiontwo: '',
        //             persionthr: ''
        //         };
        //         var num = {
        //             1: 'persiontwo',
        //             0: 'persionthr'
        //         }
        //         obj.account = params.account;
        //         let sql = 'select * from user where account = "' + params.uppersion + '"';
        //         connection.query(sql, function (err, rows) {
        //             console.log("3333333333333333333");
        //             var rows = rows;
        //             if (rows.length >= 1 && params.uppersion !== "admin") {
        //                 let sql = 'SELECT * FROM user  WHERE `account` IN ( ' + params.uppersion + ',' +
        //                     '(select u.`uppersion` from user u where `account`=' + params.uppersion + '));'
        //                 connection.query(sql, function (err, rows) {
        //                     debugger;
        //                     var rows = rows;
        //                     if (rows.length > 0) {
        //                         for (var i = 0; i < rows.length; i++) {
        //                             obj[num[i]] = rows[i].uppersion;
        //                             if (rows[i].uppersion === '润濠' || rows[i].uppersion === 'admin') {
        //                                 break;
        //                             }
        //                         }
        //                     }
        //                     insetPersion();
        //                 })
        //             } else {
        //                 insetPersion();
        //             }
        //         })

        //         function insetPersion() {
        //             console.log('obj:' + obj)
        //             // let sql_insert = 'select * from user where account = ' + params.uppersion;
        //             models.Persion.forge().save(obj).then(function (result) {
        //                 debugger;
        //                 return models.User.forge({
        //                     account: currentaccount
        //                 }).fetch().then(function (user) {
        //                     debugger;
        //                     res.json({
        //                         success: true,
        //                         data: user.attributes,
        //                         msg: '添加成功'
        //                     })
        //                 })
        //             })
        //         }

        //     }
        // })


        // } else {
        //     models.User.forge().where('id', '=', reslut.attributes.id).destroy().then(function () {
        //         res.json({
        //             success: false,
        //             msg: '上级用户不存在'
        //         })
        //     })
        // }
        // /* |||||||||||||||||||||||||||||||||||| */ //管理员的数据处理完毕
        // connection.release();
        // });
        // });
        // }).catch(function (err) {
        //     res.json({
        //         success: false,
        //         msg: '服务器错误'
        //     })
        // });
        //         }
        //     });
        // }).then((users) => {
        //     console.log('添加成功!');
        // }).catch((error) => {
        //     console.log('errrrrrrrrrrre');
        // })
    });
});

//管理员注册
router.post('/regAdmin', function (req, res, next) {


})


//用户锁定用户
router.post('/queryPersion', function (req, res, next) {
    var params = req.body;
    var status = params.persionstatus;
    var account = params.account;
    var obj = {
        "1": 'persionone',
        "2": 'persiontwo',
        "3": 'persionthr'
    }
    models.Persion.query('where', obj[params.persionstatus], '=', account).fetchAll().then(function (model) {
        if (model.models) {
            res.json({
                success: true,
                data: model.models
            })
        }
    })
});





router.get('/', function (req, res, next) {
    models.User.forge().fetchAll().then(function (user) {
        res.send('success');
    });
});

module.exports = router;