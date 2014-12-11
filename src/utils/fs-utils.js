var path = require('path');

module.exports = (function () {
	'use strict';

	return {

		toAbsolute: function (filepath) {
			return path.resolve(filepath);
		},

		isAbsolute: function (filepath) {
			return this.toAbsolute(filepath) === filepath;
		}

	};
})();
