const app = require('express')();
const port = process.env.NODE_PORT || 3000;

const { TwingEnvironment, TwingLoaderFilesystem } = require('twing');
let loader = new TwingLoaderFilesystem('./views');
let twing = new TwingEnvironment(loader);

const { MongoClient, ServerApiVersion } = require('mongodb');
const url = "mongodb+srv://db_user_multiapp:sS7oQwJZJGm7vuvD@cluster0.qlrgy.mongodb.net/iplocations?retryWrites=true&w=majority";

app.get('/', function (req, res) {

    twing.render('index.html', { 'name': 'World' }).then((output) => {
        res.end(output);
    });

});

app.get('/db/update', function (req, res) {

});

app.get('/json/live/ip/:ip', function (req, res) {
    MongoClient.connect(url, function (err, db) {
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
    const { IP2Location } = require("ip2location-nodejs");
    let ip2location = new IP2Location();    
    ip2location.open("./db/IP2LOCATION-LITE-DB11.bin");
    result = ip2location.getAll(req.params.ip);
    ip2location.close();

    Object.keys(result).map((key) => {
        if (typeof result[key] === 'string' && result[key].indexOf('This method') !== -1){
            delete result[key];        
        }
    });
    
    res.send(result);

});

app.listen(port, () => {
    console.log('Node.js Express server listening on port ' + port);
});