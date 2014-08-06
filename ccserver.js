
var express    = require('express');    // call express
var app        = express();         // define our app using express
var port = process.env.PORT || 8080;    // set our port

app.get('/', function(req, res){
  res.sendfile('./index.html');
});

app.use('/static', express.static(__dirname + '/static'));

app.listen(port);
console.log('Server is listening on ' + port);
