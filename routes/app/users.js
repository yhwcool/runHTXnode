
var express = require('express');
var bookshelf = require("../../db/DBconfig");
var models = require('../../model/model');
var router = express.Router();


// 查询用户
router.post('/queryAll', function (req, res, next) {
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
        if (user) {
            if (user.attributes.password === req.body.password) {
                var account = user.attributes.account;
                models.Persion.query('where', 'persionone', '=', account).fetchAll().then(function (model1) {
                    return models.Persion.query('where', 'persiontwo', '=', account).fetchAll().then(function (model2) {
                        return models.Persion.query('where', 'persionthr', '=', account).fetchAll().then(function (model3) {
                            console.log(model1.models.length);
                            console.log(model2.models.length);
                            console.log(model3.models.length);
                            res.json({
                                success: true,
                                data: user,
                                maininfo: {
                                    "persionone": model1.models.length,
                                    "persiontwo": model2.models.length,
                                    "persionthr": model3.models.length
                                }
                            })
                        })
                    })
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
    var addtime = (function () {
        var date = new Date();
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDay() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    })();
    params.addtime = addtime;
    var obj = {
        6: 0,
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
                            return models.User.forge({
                                id: currentaccountid
                            }).save({
                                money: (parseInt(currentmoney) + obj[currentstatus]),
                            }).then(function (user) { //管理员获得相应的钱
                                return models.User.forge({
                                    account: params.uppersion
                                }).fetch().then(function (uppersionone) { //查询上级，并且增加人数
                                    if (uppersionone) {
                                        var obj = {
                                            persionone: params.uppersion,
                                            persiontwo: '',
                                            persionthr: ''
                                        }
                                        obj.persiontwo = uppersionone.attributes.uppersion;
                                        models.User.forge({
                                            account: obj.persiontwo
                                        }).fetch().then(function (persionthr) {
                                            if (persionthr) {
                                                obj.persionthr = persionthr.attributes.uppersion;
                                            }
                                            obj.account = params.account;
                                            obj.addtime = addtime;
                                            models.Persion.forge().save(obj).then(function (result) {
                                                if (result) {
                                                    uppersionone.attributes.status < 3 && models.User.forge({ //更新 一级 的钱
                                                        id: uppersionone.attributes.id
                                                    }).save({
                                                        money: parseInt(uppersionone.attributes.money) + 600
                                                    }).then(function (userinfo) {
                                                        if (userinfo) {
                                                            res.json({
                                                                success: true,
                                                                data: user,
                                                                msg: '添加成功'
                                                            })
                                                            console.log('修改成功');
                                                        }
                                                    }).catch(function (err) {
                                                        console.log(err);
                                                    });
                                                }
                                            })
                                        })
                                    } else if (params.uppersion === '润濠') {
                                        res.json({
                                            success: true,
                                            data: user,
                                            msg: '添加成功'
                                        })
                                    } else {
                                        models.User.forge().where('id', '=', reslut.attributes.id).destroy().then(function () {
                                            res.json({
                                                success: false,
                                                msg: '上级用户不存在'
                                            })
                                        })

                                    }
                                })
                            })
                        }
                    }).catch(function (err) {
                        res.json({
                            success: false,
                            msg: '服务器错误'
                        })
                    });
            }
        });
    }).then((users) => {
        console.log('添加成功!');
    }).catch((error) => {
        console.log('errrrrrrrrrrre');
    })
});




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