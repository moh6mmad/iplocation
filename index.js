const app = require('express')();
const port = process.env.NODE_PORT || 3000;
const dns = require('dns');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { TwingEnvironment, TwingLoaderFilesystem } = require('twing');
const loader = new TwingLoaderFilesystem('./views');
const twing = new TwingEnvironment(loader);
const { limiter } = require('./middlewares/rateLimiter');

const { redisClient } = require('./src/redisClient');

require('dotenv').config();
app.use('/json', limiter);

/**
 * Return data of given IP
 * 
 * @param string ipAddress
 * 
 * @return array result
 */
async function getIpData(ipAddress) {

    var ip2loc = require('async-ip2location');

    let result = await redisClient.get(`ip_data_${ipAddress}`).then((result) => {
        return result;
    });  
    if (typeof result == 'string' && result !== '') {
        return JSON.parse(result);
    }

    promise = ip2loc(process.env.IPLOCATION_DB_PATH)
    .then((db) => {
        return db.get_all(ipAddress);
    })
    .then(result => {
        
        redisClient.set(`ip_data_${ipAddress}`, JSON.stringify(result));
        return result;
    });

    result = await promise;
    return result;
};

app.get('/', function (req, res) {
    var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const output = { data: getIpData(clientIp), dns: dns.getServers() };
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
    getIpData(req.params.ip).then((result) => {
        res.send(result);
    }); 
});

app.get('/json/ip', function (req, res) {
    var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    res.type('application/json');
    getIpData(clientIp).then((result) => {
        res.send(result);
    });    
});

app.listen(port, () => {
    console.log('Node.js Express server listening on port ' + port);
});
