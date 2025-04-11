# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.0] - 2025-04-11
### Added
- New `LambdaGroupAggregate` class: a reusable Lambda wrapper that performs MongoDB `group` aggregations by `field`.

## [4.0.0] - 2024-08-06
### Added
- New parameter `onlyTotals` to avoid `get()` command when only totals needed

### Changed
- Update [@janiscommerce/@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/@janiscommerce/model) to version 8xx

## [3.0.0] - 2023-04-20
### Changed
- Update [@janiscommerce/@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/@janiscommerce/model) to version 7xx
- Update [@janiscommerce/@janiscommerce/lambda](https://www.npmjs.com/package/@janiscommerce/@janiscommerce/lambda) to version 6xx

## [2.1.0] - 2023-01-17
### Added
- New parameter `excludeFields` for model to exclude fields
- New parameter `formatParams` to be passed to `format()` method

### Changed
- Now parameter `fields` is passed to model to select specific fields

## [2.0.0] - 2022-06-24
### Added
- `getPaged()` method using parameter `allItems`

### Changed
- **_Breaking change_**: Now `calculateTotals` is required to perform `getTotals()` query and return `totals`
- Updated dependencies

## [1.2.0] - 2022-06-24
### Added
- `filters` can be used as an `array` for `LambdaGet` wrapper

## [1.1.0] - 2022-05-10
### Added
- `changeKeys` param support for `LambdaGet` wrapper
- `format()` optional method for `LambdaGet` wrapper

## [1.0.0] - 2022-04-27
### Added
- `LambdaGet` wrapper
