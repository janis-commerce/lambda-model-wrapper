'use strict';

const { Lambda } = require('@janiscommerce/lambda');

const { struct } = require('@janiscommerce/superstruct');

module.exports = class Base extends Lambda {

	get mustHaveClient() {
		return true;
	}

	get struct() {
		return struct.optional({
			fields: struct.optional(['string']),
			excludeFields: struct.optional(['string']),
			filters: 'object|array?',
			page: 'number?',
			limit: 'number?',
			order: struct.union(['object?', 'string?', 'array?']),
			changeKeys: 'string?',
			allItems: 'boolean?',
			calculateTotals: 'boolean?',
			formatParams: 'object?'
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

		const { allItems, calculateTotals, formatParams, ...params } = this.data || {};

		const items = allItems
			? await this.getPagedItems(params)
			: await this.model.get(params);

		return {
			items: this.format ? await this.format(items, formatParams || {}) : items,
			...calculateTotals && { totals: await this.model.getTotals() }
		};
	}

	async getPagedItems(params) {
		const allItems = [];
		await this.model.getPaged(params, items => items.forEach(item => allItems.push(item)));

		return allItems;
	}
};
