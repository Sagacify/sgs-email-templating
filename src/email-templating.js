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
		async.waterfall([
			function (cb) {
				TemplateRenderer.addTemplates(envelope.templates, cb);
			},
			function (cb) {
				TemplateRenderer.renderTemplates(envelope.templates, envelope.inlined, data, cb);
			},
			function (renderedEnvelope, cb) {
				TemplateRenderer.renderShims(renderedEnvelope, cb);
			},
			function (cb) {
				TemplateRenderer.getAttachmentList();
			},
		])
	};

	return new EmailTemplating();
})();
