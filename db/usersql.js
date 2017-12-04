var UserSQL = {
    insert: 'INSERT INTO User(account,phone) VALUES(?,?)',
    queryAll: 'SELECT * FROM User',
    getUserByAccount: 'SELECT * FROM User WHERE account = ? ',
    loginUser : 'SELECT * FROM User WHERE account = ?',
    regUser : 'INSERT INTO user(account,password,idcard,uppersion,status) VALUES(?,?,?,?,?)'
};
module.exports = UserSQL;
