/*jslint nomen:true */
/*globals __dirname */
"use strict";
var express = require('express');
var sockjs  = require('sockjs');

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var connections = [];

var updateStatus = function () {
    var talk = false;
    connections.forEach(function (conn) {
        talk = talk || conn.talk;
    });
    connections.forEach(function (conn) {
        conn.write(talk ? 'on' : 'off');
    });
};

sockjs_server.on('connection', function (conn) {
    conn.talk = false;

    conn.on('data', function (message) {
        if (message === 'on') {
            conn.talk = true;
        } else {
            conn.talk = false;
        }
        updateStatus();
    });

    conn.on('close', function () {
        conn.talk = false;
        connections.splice(connections.indexOf(conn), 1);
        updateStatus();
    });

    connections.push(conn);
});

// 2. Express server
var app = express.createServer();
sockjs_server.installHandlers(app, {prefix: '/push_to_talk'});

console.log(' [*] Listening on 0.0.0.0:9999');
app.listen(9999, '0.0.0.0');

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
