SCWeb.core.ComponentType = {
    viewer: 0,
    editor: 1
};

SCWeb.core.ComponentManager = {
    
    /**
     * Components stored by types:
     * - viewers
     * - editors
     * Each type contains mapping of output language to component
     */
    componentsByLang: {
        viewers: {},
        editors: {}
    },
    
    componentsByFormats: {
        viewers: {},
        editors: {}
    },
    
    _listener: null,
    _counter: 0,    
    _initialize_funcs: [],
    
    init: function(callback) {
        for (var i = 0; i < this._initialize_funcs.length; i++) {
            this._initialize_funcs[i]();
        }
        
        if (callback) {
            callback();
        }
    },
    
    /**
     * Append new component initialize function
     */
    appendComponentInitialize: function(func) {
        this._initialize_funcs.push(func);
    },
    
    /**
     * Find sc-addr of output language sc-element, by system identifier
     * for specified descriptor. If it already has the last one, then do nothing
     * @param {Object} compDescr Component description object
     * @return If sc-addr resolved, then callback calls
     */
    resolveScAddrs: function(compDescr, callback) {
        
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
                for (var idx = 0; idx < compDescr.formats.length; idx++) {
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
     * Returns output language components map for specified type of component
     * @param {Number} compType Type of component
     */
    getComponentsLangMap: function(compType) {
        if (compType == SCWeb.core.ComponentType.viewer) {
            return this.componentsByLang.viewers;
        }else {
            return this.componentsByLang.editors;
        }
        
        return null;
    },
    
    /**
     * Returns supported formats components map for specified type of component
     * @param {Number} compType Type of component
     */
     getComponentsFormatMap: function(compType) {
         if (compType == SCWeb.core.ComponentType.viewer) {
             return this.componentsByFormats.viewers; 
         }else {
             return this.componentsByFormats.editors;
         }
         return null;
     },
    
    /**
     * Register new component
     * @param {Object} compDescr Component description object
     * This object must to have attributes:
     * - type - component type. @see SCWeb.core.ComponentType
     * - factory - function, that return instance of component.
     * - outputLang - output language that supports by component
     * It takes config object as a parameter, that passed into component.
     * Config object contains field such as:
     * container - id of dom caontainer to append component
     * dataAddr - sc-addr of sc-link, with data
     */
    registerComponent: function(compDescr) {
        
        var self = this;
        this.resolveScAddrs(compDescr, function() {
            var comp_map = self.getComponentsLangMap(compDescr.type);
                
            if (comp_map) {
                if (compDescr.outputLangAddr) {
                    comp_map[compDescr.outputLangAddr] = compDescr;
                }
                $.proxy(self._fireComponentRegistered(compDescr), self);
            }
            
            comp_map = self.getComponentsFormatMap(compDescr.type);
            if (comp_map) {
                $.each(compDescr.formatAddrs, function(format, addr) {
                    comp_map[addr] = compDescr;
                });
            }
        });
    },
    
    /**
     * Unregister specified component
     * @param {Object} compDescr Component description object, that passed into
     * registerComponent function.
     */
    unregisterComponent: function(compDescr) {
        
        var self = this;
        this.resolveScAddrs(compDescr, function() {
            var comp_map = self.getComponentsLangMap(compDescr.type);
            
            if (comp_map) {
                delete comp_map[compDescr.outputLangAddr];
                $.proxy(self._fireComponentUnregistered(compDescr), self);
            }
        });
    },
    
    /**
     * Create instance of specified component with supported output language
     * Each editor and view components must have such funcitons as:
     * - receiveData - function, that receive json data to show
     * - translateIdentifiers - function, that notify window, that it need to translate identifiers
     * - getIdentifiersLanguage - fucntion, that return sc-addr of used identifier language
     * - destroy - function, that calls when component destroyed. There component need to destroy all created objects
     * @param {Object} config Object that contains configuration for editor/viewer
     * @param {Number} compType Type of component @see SCWeb.core.ComponentType
     * @param {String} outputLang SC-addr of output language, that will be used to
     * view or edit in component
     * @return If component created, then return it instance; otherwise return null
     */
    createComponentInstanceByOutputLanguage: function(config, compType, outputLang) {
        var comp_map = this.getComponentsLangMap(compType);
        
        if (comp_map) {
            var comp_descr = comp_map[outputLang];
            if (comp_descr) {
                var comp = comp_descr.factory(config);
                comp._outputLang = outputLang;
                comp._id = SCWeb.core.ComponentManager._counter++;
                return comp;
            }
        }
    },
    
    /**
     * Create instance of specified component with supported output format
     * @param {Object} config Object that contains configuration for editor/viewer
     * @param {Number} compType Type of component @see SCWeb.core.ComponentType 
     * @param {String} format SC-addr of format, that will be used to view or edit in component
     */
    createComponentInstanceByFormat: function(config, compType, format) {
        var comp_map = this.getComponentsFormatMap(compType);
        
        if (comp_map) {
            var comp_descr = comp_map[format];
            if (comp_descr) {
                var comp = comp_descr.factory(config);
                comp._id = SCWeb.core.ComponentManager._counter++;
                comp._format = format;
                return comp;
            }
        }
    },
    
    /**
     * Check if there are viewer component registered for specified output language
     * @param {String} outputLang SC-addr of output language to check
     * @return If there are registered component to view output language, then return true;
     * otherwise return false.
     */
    checkViewer: function(outputLang) {
        if (this.componentsByLang[SCWeb.core.ComponentType.viewer]) {
            return true;
        }
        
        return false;
    },
    
    /**
     * Setup component listener
     * @param {Object} listener Listener object. It must to has functions:
     * - componentRegistered - function, that call when new component registered. It receive 
     * component description object as argument
     * - componentUnregistered - function, that calls after one of the component was unregistered.
     * It receive component description object as argument
     */
    setListener: function(listener) {
        this._listener = listener;
    },
    
    /**
     * Fires event when new component registered
     */
    _fireComponentRegistered: function(compDescr) {
        if (this._listener) {
            this._listener.componentRegistered(compDescr);
        }
    },
    
    /**
     * Fires event when any of components unregistered
     */
    _fireComponentUnregistered: function(compDescr) {
        if (this._listener) {
            this._listener.componentUnregistered(compDescr);
        }
    }
};
