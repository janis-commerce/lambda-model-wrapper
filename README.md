# Lambda Model Wrapper

![Build Status](https://github.com/janis-commerce/lambda-model-wrapper/workflows/Build%20Status/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/lambda-model-wrapper/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/lambda-model-wrapper?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Flambda-model-wrapper.svg)](https://www.npmjs.com/package/@janiscommerce/lambda-model-wrapper)

A package to simplify wrapper model lambda functions in Janis Services

## :inbox_tray: Installation
```sh
npm install @janiscommerce/lambda-model-wrapper
```

## :page_with_curl: Usage

### LambdaGet

LambdaGet is used to wrap the `get()` method from models.

#### Configuration

* The _getter_ `modelClass` should return the **Model** for our entity.
* The _method_ **async** `format(items)` (optional): Receives the getted items as parameter so you can format them and return the formatted items.
* You can use `mustHaveClient` to defines if the function will be used for Client models. _default_ `true`.
* You can use `mustHavePayload` to make **payload** mandatory or not. _default_ `false`.

> :info: The **payload** is used to apply params to the `get()` method, this will be explained below.

#### Get Params and _fields_

* The model `params` must be sent as body at the invoked function. For more information see [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).
* The `fields` is an _optional_ String Array to reduce response, this is very useful to make responses smaller.

> :info: See the Example section for more context.

#### Response

The response of the lambda functions is explained in the [@janiscommerce/lambda](https://www.npmjs.com/package/@janiscommerce/lambda) package.

#### Example

First you need to create your lambda function.

```js
'use strict';

const { Handler } = require('@janiscommerce/lambda');
const { LambdaGet } = require('@janiscommerce/lambda-wrapper-model');

const ProductModel = require('../../models/product');

class GetProduct extends LambdaGet {

	get modelClass() {
		return ProductModel;
	}

	async format(items) {

		return items.map(item => {
			// do some formatting
			return item;
		});
	}
}

module.exports.handler = (...args) => Handler.handle(GetProduct, ...args);
```

For using the lambda you need to invoke with the [@janiscommerce/lambda](https://www.npmjs.com/package/@janiscommerce/lambda) package.

```js
'use strict';

const { Invoker } = require('@janiscommerce/lambda');

async () => {

	const response = await Invoker.clientCall('GetProduct', 'my-client-code');

	/**
	 *	response.payload: {
		 	items: [
				{ id: 1, referenceId: 'coke-123', name: 'Coke' },
				{ id: 2, referenceId: 'pepsi-456', name: 'Pepsi' }
			],
			totals: { total: 2, page: 1 }
	 	}
	 */

	const filteredResponse = await Invoker.clientCall('GetProduct', 'my-client-code', {
		filters: { name: 'Coke' },
		fields: ['id', 'referenceId']
	});

	/**
	 *	filteredResponse.payload: {
		 	items: [
				{ id: 1, referenceId: 'coke-123' }
			],
			totals: { total: 1, page: 1 }
	 	}
	 */

};

```
