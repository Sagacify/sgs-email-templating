var fsUtils = require('../utils/fs-utils');

var htmlToText = require('html-to-text');
var handlebars = require('handlebars');
var async = require('async');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

module.exports = (function () {
	'use strict';

	function TemplateRenderer () {
		this.templateCache = {};

		this.templateShims = {
			text: {
				html: {
					context: htmlToText,
					method: 'fromString'
				}
			}
		};

		this.templateKeys = [
			'subject',
			'html',
			'text'
		];

		this.staticsPath = '';

		this.useShims = false;

		this.matchCidRegExp = /\"cid\:([^\"]+)\"/gi;
	}

	TemplateRenderer.prototype.init = function (config) {
		config = config || {};

		if (typeof config.staticsPath === 'string') {
			this.staticsPath = config.staticsPath;
		}

		if (Array.isArray(config.templateKeys)) {
			this.templateKeys = _.union(this.templateKeys, config.templateKeys);
		}

		if ('helpers' in config) {
			Object.keys(config.helpers).forEach(function (name) {
				this.addHelper(name, config.helpers[name]);
			}.bind(this));
		}

		if ('useShims' in config) {
			this.useShims = config.useShims;
		}
	};

	TemplateRenderer.prototype.addHelper = function (name, helper) {
		handlebars.registerHelper(name, helper);
	};

	TemplateRenderer.prototype.getTemplateList = function (templates) {
		return this.templateKeys
			.reduce(function (templateList, templateKey) {
				if (typeof templates[templateKey] === 'string') {
					templateList.push(templates[templateKey]);
				}

				return templateList;
			}, []);
	};

	TemplateRenderer.prototype.addTemplates = function (templates, options, callback) {
		if (arguments.length === 2) {
			callback = options;
			options = {};
		}

		var templateList = this.getTemplateList(templates);

		async.each(
			templateList,
			function (template, cb) {
				return this.addTemplate(template, options, cb);
			}.bind(this),
			callback
		);
	};

	TemplateRenderer.prototype.addTemplate = function (templatePath, options, callback) {
		if (fsUtils.isAbsolute(templatePath) !== true) {
			templatePath = fsUtils.toAbsolute(templatePath);
		}

		if (templatePath in this.templateCache && options.cacheBust !== true) {
			return callback(null, this.templateCache[templatePath]);
		}

		fs.readFile(templatePath, 'utf8', function (e, template) {
			if (e) {
				return callback(e);
			}

			this.templateCache[templatePath] = handlebars.compile(template);

			return callback(null, this.templateCache[templatePath]);
		}.bind(this));
	};

	TemplateRenderer.prototype.renderTemplates = function (templates, inlined, data, callback) {
		templates = templates || {};
		inlined = inlined || {};

		async.map(
			this.templateKeys,
			function (templateKey, cb) {
				var templatePath = templates[templateKey];

				if (typeof inlined[templateKey] === 'string') {
					return cb(null, inlined[templateKey]);
				}

				if (typeof templatePath === 'string') {
					return cb(null, this.templateCache[templatePath](data));
				}

				return cb(null, null);
			}.bind(this),
			function (e, renderedTemplates) {
				if (e) {
					return callback(e);
				}

				return callback(null, _.object(this.templateKeys, renderedTemplates));
			}.bind(this)
		);
	};

	TemplateRenderer.prototype.getShim = function (renderedEnvelope, templateKeys, unsetTemplateKey) {
		var shims = this.templateShims[unsetTemplateKey];
		var shim = false;
		var len = templateKeys.length;
		var templateKey;

		while (len-- && shim === false) {
			templateKey = templateKeys[len];

			if (templateKey !== unsetTemplateKey && shims[templateKey] && renderedEnvelope[templateKey]) {
				shim = templateKey;
			}
		}

		return shim;
	};

	TemplateRenderer.prototype.applyShim = function (renderedEnvelope, unsetTemplateKey, shimKey) {
		var shimData = renderedEnvelope[shimKey];
		var shimMethod = this.templateShims[unsetTemplateKey][shimKey].method;
		var shimContext = this.templateShims[unsetTemplateKey][shimKey].context;

		if (!Array.isArray(shimData)) {
			shimData = [shimData];
		}

		var shimTemplate = shimContext[shimMethod].apply(shimContext, shimData);

		renderedEnvelope[unsetTemplateKey] = shimTemplate;

		return renderedEnvelope[unsetTemplateKey];
	};

	TemplateRenderer.prototype.renderShims = function (renderedEnvelope, callback) {
		if (this.useShims !== true) {
			return callback(null, renderedEnvelope);
		}

		var templateKey;
		var shimKey;

		for (var i = 0, len = this.templateKeys.length; i < len; i++) {
			shimKey = null;
			templateKey = this.templateKeys[i];

			if (renderedEnvelope[templateKey] == null) {
				shimKey = this.getShim(renderedEnvelope, this.templateKeys, templateKey);
			}
			if (shimKey !== null) {
				this.applyShim(renderedEnvelope, templateKey, shimKey);
			}
		}

		return callback(null, renderedEnvelope);
	};

	TemplateRenderer.prototype.getAttachmentList = function (renderedEnvelope, attachments, callback) {
		var concatenatedTemplates = this.templateKeys
			.map(function (templateKey) {
				var templateValue = ''

				if (typeof renderedEnvelope[templateKey] === 'string') {
					templateValue = renderedEnvelope[templateKey];
				}

				return templateValue;
			})
			.join('');

		var embeddedAttachmentList = concatenatedTemplates.match(this.matchCidRegExp) || [];
		var embeddedAttachmentCids = {};

		var embeddedAttachments = embeddedAttachmentList
			.reduce(function (embeddedAttachments, attachmentCid) {
				var filename = attachmentCid.replace(/\"/g, '').substr(4);

				if (!(attachmentCid in embeddedAttachmentCids)) {
					embeddedAttachments.push({
						cid: filename,
						filename: filename,
						path: path.resolve(this.staticsPath, filename)
					});

					embeddedAttachmentCids[attachmentCid] = true;
				}

				return embeddedAttachments;
			}.bind(this), []);

		renderedEnvelope.attachments = [].concat(
			attachments || [],
			embeddedAttachments
		);		

		return callback(null, renderedEnvelope);
	};

	return new TemplateRenderer();
})();
