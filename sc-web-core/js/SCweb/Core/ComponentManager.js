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
    components: {
        viewers: {},
        editors: {}
    },
    
    _listener: null,
    
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
    resolveOutpuLangAddr: function(compDescr, callback) {
        
        if (compDescr.outputLangAddr) {
            callback();
        }
        
        SCWeb.core.Server.resolveScAddr([compDescr.outputLang], function(addrs) {
            var sc_addr = addrs[compDescr.outputLang];
            if (sc_addr) {
                compDescr["outputLangAddr"] = sc_addr;
                callback();
            }
        });
    },
    
    /**
     * Returns components map for specified type
     * @param {Number} compType Component type
     */
    getComponentsMap: function(compType) {
        if (compType == SCWeb.core.ComponentType.viewer) {
            return this.components.viewers;
        }else {
            return this.components.editors;
        }
        
        return null;
    },
    
    /**
     * Register new component
     * @param {Object} compDescr Component description object
     * This object must to have attributes:
     * - type - component type. @see SCWeb.core.ComponentType
     * - factory - function, that return instance of component.
     * It takes config object as a parameter, that passed into component.
     * - outputLang - output language that supports by component
     */
    registerComponent: function(compDescr) {
        
        var self = this;
        this.resolveOutpuLangAddr(compDescr, function() {
            var comp_map = self.getComponentsMap(compDescr.type);
                
            if (comp_map) {
                comp_map[compDescr.outputLangAddr] = compDescr;
                $.proxy(self._fireComponentRegistered(compDescr), self);
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
        this.resolveOutpuLangAddr(compDescr, function() {
            var comp_map = self.getComponentsMap(compDescr.type);
            
            if (comp_map) {
                delete comp_map[compDescr.outputLangAddr];
                $.proxy(self._fireComponentUnregistered(compDescr), self);
            }
        });
    },
    
    /**
     * Create instance of specified component.
     * Each editor and view components must have such funcitons as:
     * - receiveData - function, that receive json data to show
     * - translateIdentifiers - function, that notify window, that it need to translate identifiers
     * - getIdentifiersLanguage - fucntion, that return sc-addr of used identifier language
     * - destroy - function, that calls when component destroyed. There component need to destroy all created objects
     * @param {Object} config Object that contains configuration for editor/viewer
     * @param {Number} compType Component type @see SCWeb.core.ComponentType
     * @param {String} outputLang SC-addr of output language, that will be used to
     * view or edit in component
     * @return If component created, then return it instance; otherwise return null
     */
    createComponentInstance: function(config, compType, outputLang) {
        var comp_map = this.getComponentsMap(compType);
        
        if (comp_map) {
            var comp_descr = comp_map[outputLang];
            if (comp_descr) {
                var comp = comp_descr.factory(config);
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
        if (this.components[SCWeb.core.ComponentType.viewer]) {
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
