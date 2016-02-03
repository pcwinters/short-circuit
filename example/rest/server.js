/*eslint-disable no-console */

var browserify = require('browserify-middleware');
var express = require('express');
var _ = require('lodash');

var app = express();
app.use(express.static(__dirname + '/public'));
app.get('/app.js', browserify('./app/index.js'));

var resources = {
    todo: {
        1: {id: 1, message: "Get the bread"},
        2: {id: 2, message: "Get the milk"}
    }
};

app.get('/api/:resource', function(req, res){
    return res.json(
        _(resources[req.params.resource])
            .values()
            .orderBy(['id'], ['desc'])
            .value());
});

app.get('/api/:resource/:id', function(req, res){
    return res.json(resources[req.params.resource][req.params.id]);
});

app.listen(3000);
console.log('Listening on port 3000');
