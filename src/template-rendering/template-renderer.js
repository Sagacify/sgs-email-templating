var fsUtils = require('../utils/fs-utils');

var handlebars = require('handlebars');
var async = require('async');
var fs = require('fs');
var _ = require('underscore');

module.exports = (function () {
	'use strict';

	function TemplateRenderer () {
		this.templateCache = {};

		this.templateKeys = [
			'subject',
			'html',
			'text'
		];
	}

	TemplateRenderer.prototype.init = function (config) {
		config = config || {};

		if (Array.isArray(config.templateKeys)) {
			this.templateKeys = _.union(this.templateKeys, config.templateKeys);
		}
	};

	TemplateRenderer.prototype.getTemplateList = function (templates) {
		return this.templateKeys
			.reduce(function (templateList, templateKey) {
				if (typeof templates[templateKey] === 'string') {
					templateList.push(templateKey);
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

			return callback(null, this.templateCache[templatePath);
		}.bind(this));
	};

	TemplateRenderer.prototype.renderTemplate = function (templates, inlined, data, callback) {
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

	TemplateRenderer.prototype.renderShims = function (renderedEnvelope) {
		
	};

	return new TemplateRenderer();
})();
