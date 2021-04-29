let express = require('express'),
    path = require('path'),
    httpPort = process.env.WEB_SERVER_PORT || 80,
    wsPort = 8081,
    app = express();

    var debug = require('debug')('node_blog:server');

// middle ware bidy parser
let bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

app.get("/", (req, res) => {
    debug("index debug");
    res.sendFile(path.join(__dirname+'/public/index.html'));
})



app.listen(httpPort, function () {
    console.log('HTTP Server: http://localhost:' + httpPort);
});