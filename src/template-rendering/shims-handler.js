var htmlToText = require('html-to-text');

module.exports = (function () {
	'use strict';

	function ShimsHandler () {
		this.templateShims = {
			text: {
				html: htmlToText
			}
		};
	}

	ShimsHandler.prototype.getShim = function (keys, setKeys) {
		var shim = false;
		var len = keys.length;

		while (len-- && shim === false) {

		}

		return shim;
	};

	return new ShimsHandler();
})();
