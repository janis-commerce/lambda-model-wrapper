'use strict';

const { Lambda } = require('@janiscommerce/lambda');

const { struct } = require('@janiscommerce/superstruct');

const objectsNormalizer = require('objects-normalizer');

const isObject = require('../helpers/is-object');

module.exports = class Base extends Lambda {

	get mustHaveClient() {
		return true;
	}

	get struct() {
		return struct.optional({
			fields: struct.optional(['string']),
			filters: 'object|array?',
			page: 'number?',
			limit: 'number?',
			order: struct.union(['object?', 'string?', 'array?']),
			changeKeys: 'string?',
			allItems: 'boolean?',
			calculateTotals: 'boolean?'
		});
	}

	get model() {

		if(!this._model)
			this._model = this.session.getSessionInstance(this.modelClass);

		return this._model;
	}

	async process() {

		if(!this.modelClass)
			throw new Error('modelClass is required');

		const { fields, allItems, calculateTotals, ...params } = this.data || {};

		let items = allItems
			? await this.getPagedItems(params)
			: await this.model.get(params);

		items = fields
			? this.normalizeItems(items, { fieldsToKeep: fields })
			: items;

		return {
			items: this.format ? await this.format(items) : items,
			...calculateTotals && { totals: await this.model.getTotals() }
		};
	}

	normalizeItems(items, params) {

		if(!isObject(items))
			return objectsNormalizer(items, params);

		return Object.entries(items).reduce((normalizedItems, [key, value]) => {
			normalizedItems[key] = objectsNormalizer(value, params);
			return normalizedItems;
		}, {});
	}

	async getPagedItems(params) {
		const allItems = [];
		await this.model.getPaged(params, items => items.forEach(item => allItems.push(item)));

		return allItems;
	}
};
