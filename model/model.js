var bookshelf = require("../db/DBconfig");

var User = bookshelf.Model.extend({
    tableName: "user",
});

var Update = bookshelf.Model.extend({
    tableName: "user",
});


var model = {};



model.User = User;
model.Update = Update;


module.exports = model;