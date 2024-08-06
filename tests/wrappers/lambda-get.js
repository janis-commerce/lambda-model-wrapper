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

		async format(items, { addIndex } = {}) {
			return items.map((item, index) => ({
				...item,
				...addIndex && { index }
			}));
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
				fields: ['id', 'referenceId', 'name'],
				calculateTotals: true
			}
		});

		assert.deepEqual(response, {
			items: [{
				id: '62685f1900b3e56803b9cf8c',
				referenceId: 'coke-1lt',
				name: 'Coke 1lt'
			}, {
				id: '62685f4d659ebb59d22893d7',
				referenceId: 'coke-2lt',
				name: 'Coke 2lt'
			}],
			totals: { total: 2 }
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, { fields: ['id', 'referenceId', 'name'] });
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

	it('Should call format method when Lambda has the method defined', async () => {

		const items = [{
			id: '62685f1900b3e56803b9cf8c',
			referenceId: 'coke-1lt',
			name: 'Coke 1lt'
		}, {
			id: '62685f4d659ebb59d22893d7',
			referenceId: 'coke-2lt',
			name: 'Coke 2lt'
		}];

		stubGet(items);

		sinon.spy(GetWrapperWithFormat.prototype, 'format');

		const response = await Handler.handle(GetWrapperWithFormat, { ...event });

		assert.deepEqual(response, { items });

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {});
		sinon.assert.notCalled(Model.prototype.getTotals);

		sinon.assert.calledOnceWithExactly(GetWrapperWithFormat.prototype.format, items, {});
	});

	it('Should format items passing formatParams when format method is available', async () => {

		const items = [{
			id: '62685f1900b3e56803b9cf8c',
			referenceId: 'coke-1lt',
			name: 'Coke 1lt'
		}, {
			id: '62685f4d659ebb59d22893d7',
			referenceId: 'coke-2lt',
			name: 'Coke 2lt'
		}];

		stubGet(items);

		sinon.spy(GetWrapperWithFormat.prototype, 'format');

		const response = await Handler.handle(GetWrapperWithFormat, {
			...event,
			body: { formatParams: { addIndex: true } }
		});

		assert.deepEqual(response, {
			items: [{
				...items[0],
				index: 0
			}, {
				...items[1],
				index: 1
			}]
		});

		sinon.assert.calledOnceWithExactly(Model.prototype.get, {});
		sinon.assert.notCalled(Model.prototype.getTotals);

		sinon.assert.calledOnceWithExactly(GetWrapperWithFormat.prototype.format, items, { addIndex: true });
	});

	it('Should use getPaged method when received allItems parameter', async () => {

		sinon.stub(Model.prototype, 'getPaged')
			.callsFake((params, callback) => {
				callback.call(null, [{
					id: '62685f1900b3e56803b9cf8c',
					referenceId: 'coke-1lt',
					name: 'Coke 1lt'
				}]);
				callback.call(null, [{
					id: '62685f4d659ebb59d22893d7',
					referenceId: 'coke-2lt',
					name: 'Coke 2lt'
				}]);
			});

		const response = await Handler.handle(ValidGetWrapper, {
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
				name: 'Coke 1lt'
			}, {
				id: '62685f4d659ebb59d22893d7',
				referenceId: 'coke-2lt',
				name: 'Coke 2lt'
			}]
		});

		sinon.assert.calledOnceWithExactly(
			Model.prototype.getPaged,
			{ limit: 1 },
			sinon.match.func
		);
	});

	it('Should only get totals when onlyTotals params received', async () => {

		stubGet([], { total: 300 });

		const response = await Handler.handle(ValidGetWrapper, {
			...event,
			body: {
				filters: { status: 'active' },
				onlyTotals: true
			}
		});

		assert.deepEqual(response, { totals: { total: 300 } });

		sinon.assert.notCalled(Model.prototype.get);
		sinon.assert.calledOnceWithExactly(Model.prototype.getTotals, { status: 'active' });

	});
});
