var TemplateRenderer = require('./template-rendering/template-renderer');

var async = require('async');

module.exports = (function () {
	'use strict';

	function EmailTemplating () {}

	EmailTemplating.prototype.init = function (config) {
		config = config || {};

		TemplateRenderer.init(config.templateRenderer);
	};

	EmailTemplating.prototype.renderEnvelope = function (envelope, data, callback) {
		async.parallel([
			function (cb) {
				TemplateRenderer.addTemplates(envelope.templates);
			},
			function (cb) {
				TemplateRenderer.renderTemplates(envelope.templates, envelope.inlined, data, cb);
			},
			// function (cb) {
			// 	TemplateRenderer.renderTemplates(templates);
			// },
		])
	};

	return new EmailTemplating();
})();
