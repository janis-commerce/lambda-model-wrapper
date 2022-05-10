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
			filters: 'object?',
			page: 'number?',
			limit: 'number?',
			order: struct.union(['object?', 'string?', 'array?']),
			changeKeys: 'string?'
		});
	}

	async process() {

		if(!this.modelClass)
			throw new Error('modelClass is required');

		const model = this.session.getSessionInstance(this.modelClass);

		const { fields, ...params } = this.data || {};

		let items = await model.get(params);

		items = fields
			? this.normalizeItems(items, { fieldsToKeep: fields })
			: items;

		return {
			items: this.format ? await this.format(items) : items,
			totals: await model.getTotals()
		};
	}

	normalizeItems(items, params) {

		if(!isObject(items))
			return objectsNormalizer(items, params);

		return Object.entries(items).reduce((normalizedItems, [key, value]) => {
			normalizedItems[key] = objectsNormalizer(value, params);
			return normalizedItems;
		},{})
	}
};
