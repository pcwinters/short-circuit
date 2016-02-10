/*eslint-disable no-console */

var browserify = require('browserify-middleware');
var express = require('express');
var _ = require('lodash');
var baconipsum = require('baconipsum');
var bodyParser = require('body-parser');

// parse application/json
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.get('/app.js', browserify('./app/index.js'));

var resources = {
    userPreference: {
        1: { id: 1, limit: 10 }
    },
    todo: _(100).range() // 100 random bacon todos
        .reduce(function(all, index){
            all[index] = {
                id: index,
                message: baconipsum(5)
            };
            return all;
        }, {})
};

app.post('/api/:resource', function(req, res){
    return res.json(
        _(resources[req.params.resource])
            .values()
            .slice(req.body.offset, req.body.offset+req.body.limit)
            .value());
});

app.get('/api/:resource/:id', function(req, res){
    return res.json(resources[req.params.resource][req.params.id]);
});

app.listen(3000);
console.log('Listening on port 3000');
