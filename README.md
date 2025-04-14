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

#### Configuration

* The _getter_ `modelClass` should return the **Model** for our entity.
* You can use `mustHaveClient` to defines if the function will be used for Client models. _default_ `true`.
* You can use `mustHavePayload` to make **payload** mandatory or not. _default_ `false`.

> ℹ️ The **payload** is used to apply params to the `get()` method, this will be explained below.

#### Parameters

All parameters are _optional_

* `fields`. _String Array_ to reduce response. For more information see [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).
* `excludeFields`. _String Array_ to reduce response. *Since 2.1.0*. For more information see [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).
* `allItems`. _Boolean_ to obtain all items, using `getPaged()` method. _default_ `false`. _**Since 2.0.0**_
* `calculateTotals`. _Boolean_ to calculate totals with `getTotals()` method. _default_ `false`. _**Since 2.0.0**_
* `filters`, `page`, `limit`, `order`, `changeKeys`. Classic `get()` parameters. For more information see [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model).
* `formatParams`. _Object_ to pass parameters to `format()` method. *Since 2.1.0*. See Formatting results below.
* `onlyTotals`. _Boolean_ to only calculate totals with optional `filters`. *Since 4.0.0*.

#### Formatting results

The optional _method_ **async** `format(items, formatParams)` allows you to format every item.
The `formatParams` can be used give different behaviors to the function.

#### Totals

To obtain the totals _object_ is required to

#### Response

The response of the lambda functions is explained in the [@janiscommerce/lambda](https://www.npmjs.com/package/@janiscommerce/lambda) package.

#### Examples

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

	async format(items, { countImages }) {
		return items.map(item => ({
			...item,
			...countImages && { imagesCount: item?.images.length || 0 }
		}));
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
				{ id: 1, referenceId: 'coke-2lt', name: 'Coke lts', stock: 100, images: ['coke-2lt.jpg'] },
				{ id: 2, referenceId: 'pepsi-2lt', name: 'Pepsi 2lts', stock: 100 },
				{ id: 3, referenceId: 'fanta-2lt', name: 'Fanta 2lts', stock: 95 }
			]
	 	}
	 */

	const filteredResponse = await Invoker.clientCall('GetProduct', 'my-client-code', {
		filters: { stock: 100 },
		fields: ['referenceId', 'images'],
		calculateTotals: true,
		formatParams: { countImages: true }
	});

	/**
	 *	filteredResponse.payload: {
		 	items: [
				{ id: 1, referenceId: 'coke-2lt', images: ['coke-2lt.jpg'], imagesCount: 1 },
				{ id: 2, referenceId: 'pepsi-2lt', imagesCount: 0 }
			],
			totals: { total: 2, page: 1 }
	 	}
	 */

};

```

### 🧮 LambdaGroupAggregate
The **LambdaGroupAggregate** wrapper allows you to easily create a Lambda that performs a MongoDB `aggregate()` with a simple $group by a specific field.

This wrapper is designed for **one Lambda per service**, and supports grouping for multiple entities using a common pattern.

#### ✅ When to use
Use **LambdaGroupAggregate** if you want to expose a Lambda that groups documents by a specific field and returns a count for each group.

#### 📦 Usage
Extend the **LambdaGroupAggregate** class and define the entities getter with the available entities for this service.

Each entity must be mapped to its corresponding model class.

```javascript
'use strict';

const { Handler } = require('@janiscommerce/lambda');
const { LambdaGroupAggregate } = require('@janiscommerce/lambda-model-wrapper');

const ProductModel = require('./models/product');
const ProductImageModel = require('./models/product-image');
const BrandModel = require('./models/brand');

class GroupAggregate extends LambdaGroupAggregate {

	get entities() {
		return {
			product: ProductModel
			'product-image': ProductImageModel,
			brand: BrandModel
		};
	}
};

module.exports.handler = (...args) => Handler.handle(GroupAggregate, ...args);

```

#### 📤 Expected Input
The request body should include the following:

```json
{
	"entity": "product",
	"field": "status"
}
```

* `entity`: The key defined in the `entities` getter (e.g. `'product'`)
* `field`: The field in the model to group by (e.g. `'status'`)

#### 📥 Response

The Lambda will respond with an object containing the group values and the corresponding counts:

```json
{
	"active": 450,
	"inactive": 20,
	"error": 1
}
```

#### ⚠️ Field Index Requirement

**Important: The field provided in the request body must have an index defined in the corresponding MongoDB collection.**

Internally, the aggregation uses a `hint` to force index usage:

If the specified field is not indexed with `{ [field]: 1 }`, the lambda will fail with an error like:

> MongoServerError: hint provided does not correspond to an existing index

✅ Make sure to create the appropriate index in your model or migration before using this lambda.

#### 🧪 Example Aggregation

Internally, the Lambda will run a simple `$group` aggregation on the selected model:

```javascript
await model.aggregate([
	$group: {
		_id: `$${field}`,
		count: { $sum: 1 }
	},
], {
	allowDiskUse: true,
	hint: { [${field}]: 1 }
});
```

#### 📡 How to invoke
To call a Lambda using **LambdaGroupAggregate**, use the `@janiscommerce/lambda` package from another service.

```javascript
'use strict';

const { Invoker } = require('@janiscommerce/lambda');

const result = await Invoker.clientCall('your-service-name', 'your-lambda-name', {
	entity: 'product',
	field: 'status'
});

```

#### ✅ Result

The result will be an object mapping the grouped field values to their count:

```javascript
{
	active: 450,
	inactive: 20,
	error: 1
}
```

* If the entity or field is missing or invalid, the Lambda will respond with a `400` error.
* If the model returns no data, an empty object will be returned.