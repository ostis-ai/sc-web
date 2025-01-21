# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 21.01.2025

### Breaking changes

- All action answers were renamed to results.
- All questions were renamed to actions.
- Build and run scripts were removed:
    - Use `scripts/install_dependencies.sh` and `npm run build` instead of `scripts/install.sh`
    - Use `npm run build` instead of `scripts/build_sc_web.sh`
    - Use `python3 server/app.py` instead of `scripts/run_sc_web.sh`

### Changed

- Convert .png of sc.g-elements to .svg
- Migrate to sc-machine 0.10.0
- Rename answer to result
- Rename questions to actions
- Use venv for python dependencies

### Removed

- Script `run_sc_web.sh`
- Script `build_sc_web.sh`
- Script `install.sh`

## [0.8.1-Unlock] - 22.01.2024

### Fixed

- Specification of component
- Help modal
- Fix sc.g-edge and sc.g-arc common var styles

### Removed

- Script `run_scweb.sh`
- Script `install.sh`

## [0.8.0-Fusion] - 24.09.2023

### Added

- Add CLI argument to add hosts to CORS Allowed Origin header  
- Duplicate target sc.g-elements on sc.g-scene for reflexive and multiple connectors
- Change sc.g-links types
- Change sc.g-links identifiers
- Edit mode DistanceBasedSCgView with url argument `view_mode`
- Debounced buffered append and remove tasks in scg-update-from-sc-translator
- Links autoscaling with images and pdf size
- Reconnection to sc-server
- Show element text as main idtf without language if main idtf with language is not found
- Translate sc-links constancy from gwf
- Add opportunity to create links with constancy mask
- Generalize all scripts
- Translate system identifiers in scg-editor
- View sc-links identifiers
- Load sc-links identifiers from gwf
- Not erase elements from basic ontology structure in scg-editor
- Erase elements in scg-editor
- Add scg speedup
- Add ability to edit links and save changes
- Add double click logic in scg view
- Add scale change logic in scg iframe view by event
- Add border and tools parameter to view window
- Add language parameter to view window
- Build docs in SCn format
- Add optional buttons to delete function

### Fixed

- Check OS type in `install_dependencies.sh`
- Check apt command for Linux OS in `install_deps_ubuntu.sh`
- Node classes svg elements
- Memory leaks if elements removed from scg-scene
- Remove listeners for scg-elements html-objects if elements were removed
- Double click by sc-elements that aren't synchronized
- Check addr before search by it sc-links and sc-nodes
- Reset sc-links formats after synchronize
- Set and reset link content with images and pdf before and after synchronize
- Main and system identifier translation with current language in scg-editor
- Check edges on generateArcEventRequest and eraseArcEventRequest ([120](https://github.com/ostis-ai/sc-web/issues/120), [121](https://github.com/ostis-ai/sc-web/issues/121))
- Create links with unspecified constancy in scg-editor
- SC.g-contours and its sc.g-elements create, edit, extend, select, move, click and delete
- Integrate nodes in scg-editor
- Change identifier by apply in scg-identifier
- Integrate contours in scg-editor
- Selected structure free when mouse leave window
- When window become smaller scg tools change location and no scroll appears
- Pointer cursor when hovering over expert mode switch label
- Attribute `sc_control_sys_idtf` for sidebar collapse button
- Add curl to dependencies installation script
- Add the ability to drag nodes and resize them in scg
- Zoom scg by cursor
- After reloading, the page URL is not replaced
- Display interface elements only after page load

### Changed

- SC.g-elements icons in change type tools
- Refactor scg-update-from-sc-translator and scg-update-to-sc-translator
- View identifiers with scn-component from sc-json

### Deprecated

- Deprecate url argument `mode` by `edit_mode`
- Deprecate url argument `edit_mode` value `scg_just_view` by `scg_view_only`
- Deprecate url flag `scg_structure_view_only` by `full_screen_scg`

### Removed

- Popover view for set link content
- Remove `A` button from main frame

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
- Add scg view only mode and it's configuration support in scg iframe
- Displaying elements in the SCg depending on their distance from the root element
- Auto-scaling svg within container border

### Changed

- Migrate tornado server from python2 to python3
- Migrate from tornado 4.2 to tornado 6.1.0
- Imrpove README
- Clean up dependencies installation

### Fixed

- hide background after tool buttons click
