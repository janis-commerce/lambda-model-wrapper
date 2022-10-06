# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
