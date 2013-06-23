SCWeb.core.ComponentType = {
    viewer : 0,
    editor : 1
};

SCWeb.core.ComponentManager = (function() {

    /**
     * Components stored by types: - viewers - editors Each type contains
     * mapping of output language to component
     */
    var _componentsByLang = {
        viewers : {},
        editors : {}
    };

    var _componentsByFormats = {
        viewers : {},
        editors : {}
    };

    var _counter = 0;
    var _initializeFuncs = [];
    var _callback = null;
    var _componentCount = 0;
    var _components = [];

    return {
        init : function(callback) {

            SCWeb.core.Environment.on(
                    SCWeb.core.events.Component.NEW_CONTAINER, $.proxy(
                            this.onNewContainer, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Component.DESTROY_CONTAINER, $.proxy(
                            this.onDestroyContainer, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Core.START, $.proxy(
                    this.initializeComponents, this));
            $(document).on(SCWeb.core.events.Global.NEW_COMPONENT,
                    $.proxy(this.onNewComponent, this));
            // callback will be invoked when all component will be registered
            _callback = callback;
            _componentCount = _initializeFuncs.length;
        },

        initializeComponents : function() {

            for ( var i = 0; i < _initializeFuncs.length; i++) {
                _initializeFuncs[i]();
            }
        },

        onNewComponent : function(event, initFunc) {

            this.appendComponentInitialize(initFunc);
        },

        /**
         * Append new component initialize function
         */
        appendComponentInitialize : function(func) {

            _initializeFuncs.push(func);
        },

        onNewContainer : function(eventData) {

            if (eventData.format) {
                this
                        .createComponentInstanceByFormat(eventData.container,
                                eventData.dataAddr, eventData.cmpType,
                                eventData.format);
            } else {
                this.createComponentInstanceByOutputLanguage(
                        eventData.container, eventData.cmpType,
                        eventData.outLang);
            }
        },

        onDestroyContainer : function(containerId) {

            var cmp = _components[containerId];
            cmp.destroy();
        },
        /**
         * Find sc-addr of output language sc-element, by system identifier for
         * specified descriptor. If it already has the last one, then do nothing
         * 
         * @param {Object}
         *            compDescr Component description object
         * @return If sc-addr resolved, then callback calls
         */
        resolveScAddrs : function(compDescr, callback) {

            if (compDescr.outputLangAddr) {
                callback();
            }

            var addrs = [];
            if (compDescr.outputLang) {
                addrs.push(compDescr.outputLang);
            }
            if (compDescr.formats) {
                addrs = addrs.concat(compDescr.formats);
            }

            SCWeb.core.Server.resolveScAddr(addrs, function(addrs) {

                var sc_addr = addrs[compDescr.outputLang];
                if (sc_addr) {
                    compDescr["outputLangAddr"] = sc_addr;
                }

                // process formats
                compDescr["formatAddrs"] = {};
                if (compDescr.formats) {
                    for ( var idx = 0; idx < compDescr.formats.length; idx++) {
                        var format = compDescr.formats[idx];
                        var sc_addr = addrs[format];
                        if (sc_addr) {
                            compDescr.formatAddrs[format] = sc_addr;
                        }
                    }
                }

                compDescr._addrs_map = addrs;

                callback();
            });
        },

        /**
         * Returns output language components map for specified type of
         * component
         * 
         * @param {Number}
         *            compType Type of component
         */
        getComponentsLangMap : function(compType) {

            if (compType == SCWeb.core.ComponentType.viewer) {
                return _componentsByLang.viewers;
            } else {
                return _componentsByLang.editors;
            }
        },

        /**
         * Returns supported formats components map for specified type of
         * component
         * 
         * @param {Number}
         *            compType Type of component
         */
        getComponentsFormatMap : function(compType) {

            if (compType == SCWeb.core.ComponentType.viewer) {
                return _componentsByFormats.viewers;
            } else {
                return _componentsByFormats.editors;
            }
        },

        /**
         * Register new component
         * 
         * @param {Object}
         *            compDescr Component description object This object must to
         *            have attributes: - type - component type.
         * @see SCWeb.core.ComponentType - factory - function, that return
         *      instance of component. - outputLang - output language that
         *      supports by component It takes config object as a parameter,
         *      that passed into component. Config object contains field such
         *      as: container - id of dom container to append component dataAddr -
         *      sc-addr of sc-link, with data
         */
        registerComponent : function(compDescr) {

            var callBackProxy = $.proxy(function() {

                var comp_map = this.getComponentsLangMap(compDescr.type);

                if (comp_map) {
                    if (compDescr.outputLangAddr) {
                        comp_map[compDescr.outputLangAddr] = compDescr;
                    }
                    SCWeb.core.Environment.fire(
                            SCWeb.core.events.Component.REGISTERED, compDescr);
                }

                comp_map = this.getComponentsFormatMap(compDescr.type);
                if (comp_map) {
                    $.each(compDescr.formatAddrs, function(format, addr) {

                        comp_map[addr] = compDescr;
                    });
                }

                // one more component was completely registered
                _componentCount--;
                // all components were registered, invoke main callback
                if (_componentCount === 0) {
                    _callback();
                }
            }, this);
            this.resolveScAddrs(compDescr, callBackProxy);
        },

        /**
         * Unregister specified component
         * 
         * @param {Object}
         *            compDescr Component description object, that passed into
         *            registerComponent function.
         */
        unregisterComponent : function(compDescr) {

            var callbackProxy = $.proxy(function() {

                var comp_map = this.getComponentsLangMap(compDescr.type);

                if (comp_map) {
                    delete comp_map[compDescr.outputLangAddr];
                    SCWeb.core.Environment
                            .fire(SCWeb.core.events.Component.UNREGISTERED,
                                    compDescr);
                }
            }, this);
            this.resolveScAddrs(compDescr, callbackProxy);
        },

        /**
         * Create instance of specified component with supported output language
         * Each editor and view components must have such functions as: -
         * receiveData - function, that receive json data to show -
         * translateIdentifiers - function, that notify window, that it need to
         * translate identifiers - getIdentifiersLanguage - function, that
         * return sc-addr of used identifier language - destroy - function, that
         * calls when component destroyed. There component need to destroy all
         * created objects
         * 
         * @param {Object}
         *            config Object that contains configuration for
         *            editor/viewer
         * @param {Number}
         *            compType Type of component
         * @see SCWeb.core.ComponentType
         * @param {String}
         *            outputLang SC-addr of output language, that will be used
         *            to view or edit in component
         * @return If component created, then return it instance; otherwise
         *         return null
         */
        createComponentInstanceByOutputLanguage : function(container, compType,
                outputLang) {

            var comp_map = this.getComponentsLangMap(compType);

            if (comp_map) {
                var comp_descr = comp_map[outputLang];
                if (comp_descr) {
                    var config = {};
                    config.container = container;
                    config.core = SCWeb.sandbox.SandboxFactory
                            .buildSandbox(container);
                    _components[container] = config.core;
                    // TODO IZh: refactor lines below
                    var comp = comp_descr.factory(config);
                    comp._outputLang = outputLang;
                    comp._id = _counter++;
                }
            }
        },

        /**
         * Create instance of specified component with supported output format
         * 
         * @param {Object}
         *            config Object that contains configuration for
         *            editor/viewer
         * @param {Number}
         *            compType Type of component
         * @see SCWeb.core.ComponentType
         * @param {String}
         *            format SC-addr of format, that will be used to view or
         *            edit in component
         */
        createComponentInstanceByFormat : function(container, dataAddr,
                compType, format) {

            var comp_map = this.getComponentsFormatMap(compType);
            if (comp_map) {
                var comp_descr = comp_map[format];
                if (comp_descr) {
                    var config = {};
                    config.dataAddr = dataAddr;
                    config.container = container;
                    config.core = SCWeb.sandbox.SandboxFactory
                            .buildSandbox(container);
                    _components[container] = config.core;
                    // TODO IZh: refactor lines below
                    var comp = comp_descr.factory(config);
                    comp._id = _counter++;
                }
            }
        },

        /**
         * Check if there are viewer component registered for specified output
         * language
         * 
         * @param {String}
         *            outputLang SC-addr of output language to check
         * @return If there are registered component to view output language,
         *         then return true; otherwise return false.
         */
        checkViewer : function(outputLang) {

            return _componentsByLang[SCWeb.core.ComponentType.viewer];
        }
    };
})();
