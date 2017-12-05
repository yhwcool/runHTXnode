var express = require('express');
var bookshelf = require("../../db/DBconfig");
var models = require('../../model/model');
var router = express.Router();
/**
 * 查询 第一级
 */
//用户登陆
router.post('/checkversion', function (req, res, next) {
    // 从连接池获取连接 
    var wgtVer = req.body.version.split('.').join('');//wgtVer
    models.Update.forge().fetchAll().then(function (version) {
        version.models.forEach(element => {
            var version = element.attributes.versionnum.split('.').join('');
            console.log("new VERSION:" + parseInt(version));
            console.log("old VERSION:" + parseInt(wgtVer));
            if (parseInt(version) > parseInt(wgtVer)) {
                console.log(element.attributes.versionurl);
                res.json({
                    success: true,
                    msg: '查询到新版本',
                    url: element.attributes.versionurl
                })
            } else {
                res.json({
                    success: false,
                    msg: '没有新版本'
                })
            }
        });
    })


    // pool.getConnection(function (err, connection) {
    //     connection.query(updateSql.queryVersion, function (err, result) {
    //         console.log('get data');
    //         console.log(result);
    //         result.forEach(element => {
    //             console.log(element);
    //             var version = element.versionnum.split('.').join('');
    //             console.log(parseInt(version));
    //             console.log(parseInt(wgtVer));
    //             if (parseInt(version) > parseInt(wgtVer)) {
    //                 res.json({
    //                     success: true,
    //                     msg: '查询到新版本',
    //                     url: element.versionurl
    //                 })
    //             }else{
    //                 res.json({
    //                     success: false,
    //                     msg: '没有新版本'
    //                 })
    //             }
    //         });
    //         connection.release();
    //     });
    // });
});




router.get('/', function (req, res, next) {
        res.send('success');
});

module.exports = router;