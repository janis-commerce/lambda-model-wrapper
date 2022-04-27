'use-strict';

const sinon = require('sinon');

const { Lambda, Handler } = require('@janiscommerce/lambda');

const Model = require('@janiscommerce/model');

describe('LambdaGet', () => {

	const event = { session: { clientCode: 'defaultClient' } };

	afterEach(() => {
		sinon.restore();
	});

	class ValidGetWrapper extends LambdaGet {

		get modelClass() {
			return Model;
		}
	}

	it('Should use model to get items and response', async() => {

		await Handler.handle(ValidGetWrapper, event);

	})

});