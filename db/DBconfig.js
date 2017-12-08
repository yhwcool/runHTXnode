var knex = require('knex'),
db;    // 数据库连接

// 数据库连接配置
var config = {
client: 'mysql',        // 其他可以是pg、sqlite3
connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '81977100',
    database: 'runHTX', // 数据库名称
    charset: 'utf8'
}
};

// 保证数据库连接只初始化一次。
if (!db) {
db = knex(config);
}
var bookshelf = require('bookshelf')(db);

module.exports = bookshelf;