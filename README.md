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

LambdaGet is used to wrap the `get()` and `getPaged()` method from models.

#### Breaking changes _Since 2.0.0_ ⚠️

* In `1.x.x` the `totals` were always calculated. Now you need to need to send the `calculateTotals` parameter with **true** value.

#### Configuration

* The _getter_ `modelClass` should return the **Model** for our entity.
* The _method_ **async** `format(items)` _optional_: Receives the getted items as parameter so you can format them and return the formatted items.
* You can use `mustHaveClient` to defines if the function will be used for Client models. _default_ `true`.
* You can use `mustHavePayload` to make **payload** mandatory or not. _default_ `false`.

> ℹ️ The **payload** is used to apply params to the `get()` method, this will be explained below.

#### Parameters

All parameters are _optional_

* `fields`. _String Array_ to reduce response, this is very useful to make responses smaller.
* `allItems`. _Boolean_ to obtain all items, using `getPaged()` method. _default_ `false`. _**Since 2.0.0**_
* `calculateTotals`. _Boolean_ to calculate totals with `getTotals()` method. _default_ `false`. _**Since 2.0.0**_
* `filters`, `page`, `limit`, `order`, `changeKeys`. Classic `get()` parameters. For more information see [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).

> ℹ️ See the Example section for more context.

#### Totals

To obtain the totals _object_ is required to

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
				{ id: 1, referenceId: 'coke-123', name: 'Coke' }
			]
	 	}
	 */

	const filteredResponse = await Invoker.clientCall('GetProduct', 'my-client-code', {
		filters: { name: 'Coke' },
		fields: ['id', 'referenceId'],
		calculateTotals: true
	});

	/**
	 *	filteredResponse.payload: {
		 	items: [
				{ id: 1, referenceId: 'coke-123' },
				{ id: 2, referenceId: 'pepsi-456'}
			],
			totals: { total: 2, page: 1 }
	 	}
	 */

};

```
