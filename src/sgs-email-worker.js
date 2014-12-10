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

		this.receiver.init(config.receiver);
		SGMessagingClient.subscribe('email:receive', this.receiver.receive.bind(this.receiver), {
			concurrency: 1
		});

		this.sender.init(config.sender);
		SGMessagingClient.subscribe('email:send', this.sender.send.bind(this.sender), {
			concurrency: 10
		});
	};

	return new SGSEmailWorker();
})();
