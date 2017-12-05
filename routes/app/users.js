var express = require('express');
var bookshelf = require("../../db/DBconfig");
var models = require('../../model/model');
var router = express.Router();


// 查询用户
router.post('/queryAll', function (req, res, next) {
    console.log('666');
    var params = req.body;
    models.User.forge().fetchAll().then(function (user) {
        if (params.status != 6) {
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
    models.User.forge({
        account: req.body.account
    }).fetch().then(function (user) {
        console.log(user)
        if (user) {
            if (user.attributes.password === req.body.password) {
                res.json({
                    success: true,
                    data: user
                })
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
    var params = req.body;
    var currentaccount = params.currentaccount;//当前添加的管理员 id
    var currentmoney = params.currentmoney;//当前管理员的钱
    var currentstatus = params.currentstatus;//当前权限 
    var currentaccountid = params.currentaccountid;//当前权限 
    var obj = {
        6: 1000,
        5: 350,
        4: 300,
        3: 150
    }
    var objfirst = {
        1: 600
    }
    delete params["currentaccount"];
    delete params["currentmoney"];
    delete params["currentstatus"];
    delete params["currentaccountid"];
    console.log(params);
    bookshelf.transaction(function (t) {
        return models.User.forge({
            account: params.account
        }).fetch().then(function (user) {
            if (user) {
                res.json({
                    success: false,
                    msg: '用户已经存在'
                })
            } else {
                models.User.forge().save( //保存
                    params).then(function (reslut) { //成功之后 更新 更新管理员的账户
                        if (reslut) {
                            console.log('currentaccount : ' + currentaccount);
                            console.log('money:' + (parseInt(currentmoney) + obj[currentstatus]));
                            return models.User.forge({
                                id: currentaccountid
                            }).save(
                                {
                                    money: (parseInt(currentmoney) + obj[currentstatus]),
                                }).then(function (user) { //管理员获得相应的钱
                                    return models.User.forge({
                                        account: params.uppersion
                                    }).fetch().then(function (uppersion) { //查询上级，并且增加人数
                                        if (uppersion) {
                                            var money = uppersion.attributes.money;
                                            var firstpersion = uppersion.attributes.firstpersion;
                                            console.log('money 111: ' + money);
                                            uppersion.save({
                                                money: money + objfirst[1],
                                                firstpersion: firstpersion + 1
                                            }).then(function (uppersion) {
                                                res.json({
                                                    success: true,
                                                    data: user,
                                                    msg: '上级更新成功'
                                                })
                                            })
                                        }
                                        res.json({
                                            success: true,
                                            data: user,
                                            msg: '添加成功'
                                        })
                                    })
                                })
                        }
                    }).catch(function (err) {
                        console.log(err);
                        res.json({
                            success: false,
                            msg: '服务器错误'
                        })
                    });
            }
        });
    }).then((users) => {
        console.log('userssssssss')
        // doSomething
    }).catch((error) => {
        //handle error
    })
});


//用户锁定用户
router.post('/queryPersion', function (req, res, next) {
    var params = req.body;
    var status = params.persionstatus;
    var account = params.account;
    var firstPersion;
    var secpersion = [];
    var thrpersion=[];
    models.User.forge().fetchAll().then(function (user) {
        console.log("length:" + user.models.length);
        if (status == 0) { //查询一级代理
            user.query('where', 'uppersion', '=', account).fetch().then(function (model) {
                console.log("length:" + model.models.length);
                if (model) {
                    firstPersion = model.models; //一级代理
                    res.json({
                        success: true,
                        data: model.models
                    })
                }
            })
        } else if (status == 1) { //查询二级代理
            user.query('where', 'uppersion', '=', account).fetch().then(function (model) { //查询一级
                if (model) {
                    for (var i = 0; i < model.models.length; i++) {
                        var account = model.models[i].attributes.account;
                        console.log('account : ' + account);
                        model.query('where', 'uppersion', '=', account).fetch().then(function (model) {
                            for(var j=0;j<model.models.length;j++){
                                secpersion.push(model.models[j].attributes);
                            }
                            if(secpersion.length >=25){ //判断时候完成任务

                            }
                            res.json({
                                success: true,
                                data: secpersion
                            })
                        })
                    }
                }
            })
        }else if(status == 2){ //三级代理
             user.query('where', 'uppersion', '=', account).fetch().then(function (model) { //查询一级
                if (model) {
                    for (var i = 0; i < model.models.length; i++) {
                        var account = model.models[i].attributes.account;
                        console.log('account : ' + account);
                        model.query('where', 'uppersion', '=', account).fetch().then(function (model) {
                            for(var j=0;j<model.models.length;j++){
                                secpersion.push(model.models[j].attributes);
                            }
                            if(secpersion.length >=25){ //判断时候完成任务
                                     
                            }
                            res.json({
                                success: true,
                                data: secpersion
                            })
                        })
                    }
                }
            })
        }

        // if (params.status != 6) {
        //     user.query('where', 'status', '<', params.status).fetch().then(function (model) {
        //         if (model) {
        //             res.json({
        //                 success: true,
        //                 data: model.models
        //             })
        //         }
        //     })
        // } else {
        //     res.json({
        //         success: true,
        //         data: user.models
        //     })
        // }
    });



    // models.User.forge({
    //     account: req.body.account
    // }).fetch().then(function (user) {
    //     if (user) {
    //         if (user.attributes.password === req.body.password) {
    //             res.json({
    //                 success: true,
    //                 data: user
    //             })
    //         } else {
    //             res.json({
    //                 success: false,
    //                 msg: '密码错误'
    //             })
    //         }
    //     } else {
    //         res.json({
    //             success: false,
    //             msg: '账户不存在，请联系管理员'
    //         })
    //     }
    // });
});





router.get('/', function (req, res, next) {
    models.User.forge().fetchAll().then(function (user) {
        console.log('====================')
        console.log(user.models);
        res.send('success');
    });
});

module.exports = router;