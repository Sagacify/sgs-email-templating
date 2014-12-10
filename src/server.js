var cluster = require('cluster');
var colog = require('colog');
var async = require('async');
var os = require('os');

function Server (callback) {
	'use strict';

	var SGSEmailWorkerConfig = require('./config/email-worker')[NODE_ENV];
	var SGSEmailWorker = require('./sgs-email-worker');

	var MessagingClientConfig = require('./config/messaging-client')[NODE_ENV];
	var SGMessagingClient = require('sgs-messaging-client');

	global.Config = {};

	async.series([
		function messagingServer (cb) {
			SGMessagingClient.init(MessagingClientConfig);
			cb();
		},
		function emailWorker (cb) {
			SGSEmailWorker.init(SGSEmailWorkerConfig);
			cb();
		}
	], function (e, results) {
		if (e) {
			return (callback || console.log)(e);
		}

		colog.success(new Array(81).join('-'));

		if (callback) {
			return callback(null);
		}
	});

}

global.NODE_ENV = process.env.NODE_ENV || 'production';
if (module.parent === null) {
	Server();
}
else if (NODE_ENV === 'production' && cluster.isMaster) {
	var cpuCount = os.cpus().length;

	function createFork () {
		var worker = cluster.fork();
		colog.success('Cluster: Child process ' + worker.process.pid + ' forked.');
	}

	while (cpuCount--) {
		createFork();
	}

	cluster.on('exit', function (worker, code) {
		colog.error('Cluster: Child process ' + worker.process.pid + ' died.');
		createFork();
	});
}
else {
	module.exports = Server;
}
