var bookshelf = require("../db/DBconfig");

var User = bookshelf.Model.extend({
    tableName: "user",
});

var Update = bookshelf.Model.extend({
    tableName: "version",
});

var Persion = bookshelf.Model.extend({
    tableName: "persion",
});


var model = {};



model.User = User;
model.Update = Update;
model.Persion = Persion;

module.exports = model;