var TemplateRenderer = require('./template-rendering/template-renderer');

var async = require('async');
var _ = require('underscore');

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
			function (renderedEnvelope, cb) {
				TemplateRenderer.getAttachmentList(renderedEnvelope, envelope.attachments, cb);
			},
		], function (e, renderedEnvelope) {
			if (e) {
				return callback(e);
			}

			return callback(null, _.extend(renderedEnvelope, envelope.fields));
		});
	};

	return new EmailTemplating();
})();
