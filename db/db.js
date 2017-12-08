var db = {};
var mysql = require('mysql');
var pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '81977100',
    database: 'runHTX', // 数据库名称
    charset: 'utf8'
});

//获取连接  
db.getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback(null);
            return;
        }
        callback(connection);
    });
}
module.exports = db; 