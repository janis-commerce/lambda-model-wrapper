'use strict';

const { Lambda } = require('@janiscommerce/lambda');

const { struct } = require('@janiscommerce/superstruct');

module.exports = class LambdaGet extends Lambda {

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
			onlyTotals: 'boolean?',
			formatParams: 'object?'
		});
	}

	async process() {

		if(!this.modelClass)
			throw new Error('modelClass is required');

		const { filters, calculateTotals, onlyTotals } = this.data || {};

		this.model = this.session.getSessionInstance(this.modelClass);

		return {
			...!onlyTotals && { items: await this.getItems() },
			...(calculateTotals || onlyTotals) && { totals: await this.model.getTotals(filters) }
		};
	}

	async getItems() {

		const {
			allItems, calculateTotals, onlyTotals, formatParams, ...getParams
		} = this.data || {};

		const items = allItems
			? await this.getPagedItems(getParams)
			: await this.model.get(getParams);

		if(this.format)
			return this.format(items, formatParams || {});

		return items;
	}

	async getPagedItems(params) {

		const allItems = [];
		await this.model.getPaged(params, items => items.forEach(item => allItems.push(item)));

		return allItems;
	}
};
