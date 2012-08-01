/*jslint nomen:true */
/*globals __dirname */
"use strict";
var express = require('express');
var sockjs  = require('sockjs');
var exec = require('child_process').exec;

// 1. Sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var connections = [];
var talk = false;

var updateStatus = function () {
    talk = false;
    connections.forEach(function (conn) {
        talk = talk || conn.talk;
    });
    connections.forEach(function (conn) {
        var onOff = talk ? 'on' : 'off';
        conn.write(onOff);
        exec('osascript ' + (talk ? 'unmute.scpt' : 'mute.scpt'));
    });
};

sockjs_server.on('connection', function (conn) {
    // initial state
    conn.write(talk ? 'on' : 'off');
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

// index
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

// *.png (touchicons)
app.get('/:png.png', function (req, res) {
    res.sendfile(__dirname + '/' + req.params.png + '.png');
});
