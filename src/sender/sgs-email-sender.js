module.exports = (function () {
	'use strict';

	function SGSEmailSender () {}

	SGSEmailSender.prototype.init = function (config) {
		config = config || {};
	};

	SGSEmailSender.prototype.send = function (data, callback) {

	};

	return new SGSEmailSender();
})();
