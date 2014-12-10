var SGSEmailReceiver = require('./receiver/sgs-email-receiver');
var SGSEmailSender = require('./sender/sgs-email-sender');

var SGMessagingClient = require('sg-messaging-client');

module.exports = (function () {
	'use strict';

	function SGSEmailWorker () {
		this.receiver = SGSEmailReceiver;
		this.sender = SGSEmailSender;
	}

	SGSEmailWorker.prototype.init = function (config) {
		config = config || {};

		this.queue = new SGMessagingClient(config.redis);

		this.receiver.init(config.receiver);
		this.subscribe('email:receive', this.receiver.receive.bind(this.receiver), {
			concurrency: 1
		});

		this.sender.init(config.sender);
		this.subscribe('email:send', this.sender.send.bind(this.sender), {
			concurrency: 10
		});
	};

	SGSEmailWorker.prototype.subscribe = function (jobName, jobMethod, options) {
		this.queue().subscribe(jobName, jobMethod, options)
	};

	return new SGSEmailWorker();
});
