require('dotenv').config();
let express = require('express'),
    path = require('path'),
    httpPort = process.env.WEB_SERVER_PORT || 80,
    wsPort = 8081,
    app = express();

    var debug = require('debug')('node_blog:server');



app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

app.get("/", (req, res) => {
    debug("index debug");
    res.sendFile(path.join(__dirname+'/public/index.html'));
})
//serve css & js files
app.use('/static', express.static('public'));

let apiHandler = require('./src/api');
apiHandler.initialiseApi(app);

console.log(
    process.env.DB_PORT,
    process.env.CLAN_TAG
);
app.listen(httpPort, function () {
    console.log('HTTP Server: http://localhost:' + httpPort);
});