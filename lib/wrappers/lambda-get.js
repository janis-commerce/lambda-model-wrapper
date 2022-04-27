'use strict';

const { Lambda } = require('@janiscommerce/lambda');

const { struct } = require('@janiscommerce/superstruct');

const objectsNormalizer = require('objects-normalizer');

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
			order: struct.union(['object?', 'string?', 'array?'])
		});
	}

	async process() {

		if(!this.modelClass)
			throw new Error('modelClass is required');

		const model = this.session.getSessionInstance(this.modelClass);

		const { fields, ...params } = this.data || {};

		let items = await model.get(params);

		items = fields
			? objectsNormalizer(items, { fieldsToKeep: fields })
			: items;

		return {
			items,
			totals: await model.getTotals()
		};
	}
};
