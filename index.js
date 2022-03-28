const app = require('express')();
const port = process.env.NODE_PORT || 3000;
const dns = require('dns');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { TwingEnvironment, TwingLoaderFilesystem } = require('twing');
const loader = new TwingLoaderFilesystem('./views');
const twing = new TwingEnvironment(loader);
const { limiter } = require('./middlewares/rateLimiter');
require('dotenv').config();


app.use('/json', limiter);

getIpData = (ipAddress) => {
    const { IP2Location } = require("ip2location-nodejs");
    let ip2location = new IP2Location();
    ip2location.open(process.env.IPLOCATION_DB_PATH);
    result = ip2location.getAll(ipAddress);
    ip2location.close();

    Object.keys(result).map((key) => {
        if (typeof result[key] === 'string' && result[key].indexOf('This method') !== -1) {
            delete result[key];
        }
    });

    return result;
};

app.get('/', function (req, res) {
    var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const output = {data: getIpData(clientIp), dns: dns.getServers()};
    twing.render('index.html', output).then((output) => {
        res.end(output);
    });
});

app.get('/json/live/ip/:ip', function (req, res) {

    MongoClient.connect(process.env.MONGODB_DB_URL, function (err, db) {
        if (err) throw err;
        var dbo = db.db("iplocations");
        dbo.collection("ips").find({ ip: req.params.ip }).toArray(function (err, result) {

            if (err) throw err;

            db.close();
            res.type('application/json');
            let output = {
                status_code: 404,
                message: 'not_found'
            };

            if (result[0]) {
                output = {
                    ip: req.params.ip,
                    data: JSON.parse(result[0].data)
                };
            }
            res.send(output);
        });
    });
});

app.get('/json/ip/:ip', function (req, res) {
    res.type('application/json');
    res.send(getIpData(req.params.ip));
});

app.get('/json/ip', function (req, res) {
    var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    res.type('application/json');
    res.send(getIpData(clientIp));
});

app.listen(port, () => {
    console.log('Node.js Express server listening on port ' + port);
});
