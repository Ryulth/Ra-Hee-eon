
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require("fs");

var server = app.listen(1323, function(){
 console.log("Express server has started on port 1323");
});

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());
app.use(session({
 secret: '@#@$MYSIGN#@$#$',
 resave: false,
 saveUninitialized: true
}));


var router = require('./routes/main')(app, fs);
