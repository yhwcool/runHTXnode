var express = require('express');
var router = express.Router();

// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db/DBConfig');
var userSQL = require('../db/usersql');
// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool(dbConfig.mysql);

// 查询用户
router.post('/queryAll', function (req, res, next) {
  // 从连接池获取连接 
  var body = req.body;
  console.log(body);
  pool.getConnection(function (err, connection) {
    // 获取前台页面传过来的参数  
    // var param = req.query || req.params;
    // 建立连接 增加一个用户信息 
    connection.query(userSQL.queryAll, function (err, result) {
      // 以json形式，把操作结果返回给前台页面
      if (result.length > 0) {
        res.json({
          success: true,
          data: result
        })
      }
      // res.json(result);
      // 释放连接  
      connection.release();
    });
  });
});
//用户登陆
router.post('/loginUser', function (req, res, next) {
  // 从连接池获取连接 
  var param = req.body;
  pool.getConnection(function (err, connection) {
    connection.query(userSQL.loginUser, [param.phone], function (err, result) {
      if (result.length > 0) {
        if (result[0].password === param.password) {
          res.json({
            success: true,
            data: result
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
      connection.release();
    });
  });
});



//用户登陆
router.post('/regUser', function (req, res, next) {
  // 从连接池获取连接 
  var param = req.body;
  pool.getConnection(function (err, connection) {
    console.log('============================1');
    connection.query(userSQL.getUserByAccount, [param.phone], function (err, result) {
      console.log('============================2');
      if (result.length > 0) {
        res.json({
          success: false,
          msg: '账户已存在，不能添加!'
        })
        connection.release();
      } else {
        connection.query(userSQL.regUser, [param.phone, param.password, param.idcard, param.uppersion,param.status], function (err, result) {
          console.log('============================3');
          console.log(result);
          if (result.insertId) {
            res.json({
              success: true,
              msg: '添加成功'
            })
          }
          connection.release();
        });
      }

    });
  });
});






router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
