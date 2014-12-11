var path = require('path');

module.exports = (function () {
	'use strict';

	function AttachmentHandler () {}

	AttachmentHandler.prototype.getCids = function (str) {
		return str.match(/(ref|link|href)=\"cid\:([^\"]+)\"/gi);
	};

	AttachmentHandler.prototype.getCids = function (str) {
		return str.match(/(ref|link|href)=\"cid\:([^\"]+)\"/gi);
	};

	return new AttachmentHandler();
})();
