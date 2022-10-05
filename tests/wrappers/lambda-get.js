'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { Handler } = require('@janiscommerce/lambda');

const Model = require('@janiscommerce/model');

const { LambdaGet } = require('../../lib');

describe('LambdaGet', () => {

	const event = { session: { clientCode: 'defaultClient' } };

	const stubGet = (items, totals) => {

		sinon.stub(Model.prototype, 'get')
			.resolves(items);

		if(totals) {
			sinon.stub(Model.prototype, 'getTotals')
				.resolves(totals);
		} else
			sinon.spy(Model.prototype, 'getTotals');

	};

	afterEach(() => {
		sinon.restore();
	});

	class InvalidGetWrapper extends LambdaGet {}

	class ValidGetWrapper extends LambdaGet {

		get modelClass() {
			return Model;
		}
	}

	class GetWrapperWithFormat extends ValidGetWrapper {

		async format(items) {
			return items.map((item, index) => ({ ...item, extraField: index + 1 }));
		}
	}

	it('Should reject when modelClass getter not found', async () => {
		await assert.rejects(Handler.handle(InvalidGetWrapper, event), {
			message: 'modelClass is required'
		});
	});

	it('Should use model to get items, totals and response', async () => {

		stubGet([], { total: 0 });

		const response = await Handler.handle(ValidGetWrapper, {
			...event,
			body: { calculateTotals: true }
		});

		assert.deepEqual(response, {
			items: [],
			totals: { total: 0 }
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {});
	});

	it('Should get skus and response the items and totals with fields reducing result', async () => {

		stubGet([{
			id: '62685f1900b3e56803b9cf8c',
			referenceId: 'coke-1lt',
			name: 'Coke 1lt'
		}, {
			id: '62685f4d659ebb59d22893d7',
			referenceId: 'coke-2lt',
			name: 'Coke 2lt'
		}], {
			total: 2
		});

		const response = await Handler.handle(ValidGetWrapper, {
			...event,
			body: {
				fields: ['id', 'referenceId'],
				calculateTotals: true
			}
		});

		assert.deepEqual(response, {
			items: [{
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt'
			}, {
				id: '62685f4d659ebb59d22893d7',
				referenceId: 'coke-2lt'
			}],
			totals: { total: 2 }
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {});
	});

	it('Should get skus and response the items and totals using full params', async () => {

		stubGet({
			'coke-1lt': {
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt'
			}
		}, {
			total: 1
		});

		const response = await Handler.handle(ValidGetWrapper, {
			...event,
			body: {
				filters: { referenceId: 'coke-1lt' },
				page: 1,
				limit: 1,
				order: { name: 'asc' },
				changeKeys: 'referenceId',
				calculateTotals: true
			}
		});

		assert.deepEqual(response, {
			items: {
				'coke-1lt': {
					id: '62685f1900b3e56803b9cf8c',
					referenceId: 'coke-1lt',
					name: 'Coke 1lt'
				}
			},
			totals: { total: 1 }
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {
			filters: { referenceId: 'coke-1lt' },
			page: 1,
			limit: 1,
			order: { name: 'asc' },
			changeKeys: 'referenceId'
		});
	});

	it('Should get skus and response the items and totals using filters as an array', async () => {

		stubGet({
			'coke-1lt': {
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt',
				status: 'active'
			}
		}, {
			total: 1
		});

		const response = await Handler.handle(ValidGetWrapper, {
			...event,
			body: {
				filters: [{ referenceId: 'coke-1lt', status: ['active', 'inactive'] }, { referenceId: 'coke-2lt', status: ['active', 'inactive'] }],
				calculateTotals: true
			}
		});

		assert.deepEqual(response, {
			items: {
				'coke-1lt': {
					id: '62685f1900b3e56803b9cf8c',
					referenceId: 'coke-1lt',
					name: 'Coke 1lt',
					status: 'active'
				}
			},
			totals: { total: 1 }
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {
			filters: [{ referenceId: 'coke-1lt', status: ['active', 'inactive'] }, { referenceId: 'coke-2lt', status: ['active', 'inactive'] }]
		});
	});

	it('Should apply fields normalization when using changeKeys param', async () => {

		stubGet({
			'coke-1lt': {
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt'
			}
		});

		const response = await Handler.handle(ValidGetWrapper, {
			...event,
			body: {
				filters: { referenceId: 'coke-1lt' },
				page: 1,
				limit: 1,
				order: { name: 'asc' },
				changeKeys: 'referenceId',
				fields: ['name']
			}
		});

		assert.deepEqual(response, {
			items: {
				'coke-1lt': { name: 'Coke 1lt' }
			}
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {
			filters: { referenceId: 'coke-1lt' },
			page: 1,
			limit: 1,
			order: { name: 'asc' },
			changeKeys: 'referenceId'
		});

		sinon.assert.notCalled(Model.prototype.getTotals);
	});

	it('Should format items when format method is available', async () => {

		stubGet([{
			id: '62685f1900b3e56803b9cf8c',
			referenceId: 'coke-1lt',
			name: 'Coke 1lt'
		}, {
			id: '62685f4d659ebb59d22893d7',
			referenceId: 'coke-2lt',
			name: 'Coke 2lt'
		}]);

		const response = await Handler.handle(GetWrapperWithFormat, { ...event });

		assert.deepEqual(response, {
			items: [{
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt',
				extraField: 1
			}, {
				id: '62685f4d659ebb59d22893d7',
				referenceId: 'coke-2lt',
				name: 'Coke 2lt',
				extraField: 2
			}]
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {});
		sinon.assert.notCalled(Model.prototype.getTotals);
	});

	it('Should use getPaged method when received allItems parameter', async () => {

		sinon.stub(Model.prototype, 'get')
			.onCall(0)
			.resolves([{
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt'
			}])
			.onCall(1)
			.resolves([{
				id: '62685f4d659ebb59d22893d7',
				referenceId: 'coke-2lt',
				name: 'Coke 2lt'
			}]);

		const response = await Handler.handle(GetWrapperWithFormat, {
			...event,
			body: {
				limit: 1,
				allItems: true
			}
		});

		assert.deepEqual(response, {
			items: [{
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt',
				extraField: 1
			}, {
				id: '62685f4d659ebb59d22893d7',
				referenceId: 'coke-2lt',
				name: 'Coke 2lt',
				extraField: 2
			}]
		});

		sinon.assert.calledWithExactly(Model.prototype.get, { page: 1, limit: 1 });
		sinon.assert.calledWithExactly(Model.prototype.get, { page: 2, limit: 1 });
		sinon.assert.calledWithExactly(Model.prototype.get, { page: 3, limit: 1 });
		sinon.assert.calledThrice(Model.prototype.get);
	});

});
