'use strict';

const { Lambda } = require('@janiscommerce/lambda');

const { struct } = require('@janiscommerce/superstruct');

module.exports = class LambdaGroupAggregate extends Lambda {

	get struct() {
		return struct.partial({
			entity: 'string',
			field: 'string'
		});
	}

	async process() {

		if(!this.entities)
			throw new Error('Object getter entities is required');

		if(!this.entities[this.data.entity])
			throw new Error(`Entity ${this.data.entity} not supported`);

		this.model = this.session.getSessionInstance(this.entities[this.data.entity]);

		const result = await this.model.aggregate([{
			$group: {
				_id: `$${this.data.field}`,
				count: { $sum: 1 }
			}
		}], {
			allowDiskUse: true,
			hint: { [this.data.field]: 1 }
		});

		return result?.reduce((formatted, { id, _id, count }) => {
			// eslint-disable-next-line no-underscore-dangle
			formatted[id || _id] = count;
			return formatted;
		}, {});
	}
};
