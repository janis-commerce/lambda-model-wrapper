'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { Handler } = require('@janiscommerce/lambda');

const Model = require('@janiscommerce/model');

const { LambdaGroupAggregate } = require('../../lib');

describe('LambdaGroupAggregate', () => {

	const validEvent = {
		session: { clientCode: 'defaultClient' },
		body: {
			entity: 'product',
			field: 'status'
		}
	};

	const stubAggregate = (result = []) => {
		sinon.stub(Model.prototype, 'aggregate')
			.resolves(result);
	};

	afterEach(() => {
		sinon.restore();
	});

	class ValidWrapper extends LambdaGroupAggregate {

		get entities() {
			return {
				product: Model,
				brand: Model
			};
		}
	}

	context('When lambda is invalid', () => {

		class InvalidWrapper extends LambdaGroupAggregate {}

		it('Should reject when entities getter not found', async () => {
			await assert.rejects(Handler.handle(InvalidWrapper, validEvent), {
				message: 'Object getter entities is required'
			});
		});
	});

	context('When invalid data received', () => {

		it('Should reject when no body received', async () => {
			await assert.rejects(Handler.handle(ValidWrapper, { session: validEvent.session }));
		});

		it('Should reject when no entity received', async () => {
			await assert.rejects(Handler.handle(ValidWrapper, { session: validEvent.session, body: { field: 'status' } }));
		});

		it('Should reject when no field received', async () => {
			await assert.rejects(Handler.handle(ValidWrapper, { session: validEvent.session, body: { entity: 'product' } }));
		});

		it('Should reject when invalid entity received', async () => {
			await assert.rejects(Handler.handle(ValidWrapper, { session: validEvent.session, body: { entity: 'category', field: 'status' } }));
		});
	});

	context('When valid lambda and data received', () => {

		afterEach(() => {
			sinon.assert.calledOnceWithExactly(
				Model.prototype.aggregate,
				[{ $group: { _id: '$status', count: { $sum: 1 } } }]
			);
		});

		it('Should use model to count by field using aggregate', async () => {

			stubAggregate([{
				_id: 'active',
				count: 2435987
			}, {
				_id: 'inactive',
				count: 231
			}]);

			const response = await Handler.handle(ValidWrapper, validEvent);

			assert.deepEqual(response, {
				active: 2435987,
				inactive: 231
			});
		});

		it('Should response empty object when no data found', async () => {

			stubAggregate([]);

			const response = await Handler.handle(ValidWrapper, validEvent);

			assert.deepEqual(response, {});
		});
	});
});
