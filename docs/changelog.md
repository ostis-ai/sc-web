# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [0.7.0-Rebirth] - 12.10.2022
### Added
- Add images mime types handling from kb
- Add ctrl+c logic on py-server
- Add logging levels
- Add search by content substring through sc-server
- Add latex docs from OSTIS Standard

### Changed
- Move search by substring from py-server to js-server
- Move links/contents handling from py-server to js-server
- Switch on py-sc-client on py-server and ts-sc-client in js-server
- Rename `SCsComponent` to `SCnComponent`
- Change external language from `scs_code` to `scn_code` for `SCsComponent`

### Removed
- Remove legacy configs, refactor config file
- Remove db-reader
- Remove py-sctp-client and js-sctp-client

## [0.6.1] - 28.04.2022
### Added
- Support of rocksdb for search
- API to initiate an action
- Identifiers indexing for search optimization

### Changed
- Migrate tornado server from python2 to python3
- Migrate from tornado 4.2 to tornado 6.1.0
- Imrpove README
- Clean up dependencies installation
