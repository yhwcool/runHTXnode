var express = require('express');
var router = express.Router();

// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db/DBConfig');
var updateSql = require('../db/updatesql');
// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool(dbConfig.mysql);


/**
 * 查询 第一级
 */
//用户登陆
router.post('/checkversion', function (req, res, next) {
    // 从连接池获取连接 
    var wgtVer = req.body.version.split('.').join('');//wgtVer
    pool.getConnection(function (err, connection) {
        connection.query(updateSql.queryVersion, function (err, result) {
            console.log('get data');
            console.log(result);
            result.forEach(element => {
                console.log(element);
                var version = element.versionnum.split('.').join('');
                console.log(parseInt(version));
                console.log(parseInt(wgtVer));
                if (parseInt(version) > parseInt(wgtVer)) {
                    res.json({
                        success: true,
                        msg: '查询到新版本',
                        url: element.versionurl
                    })
                }else{
                    res.json({
                        success: false,
                        msg: '没有新版本'
                    })
                }
            });
            connection.release();
        });
    });
});



router.get('/update', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
