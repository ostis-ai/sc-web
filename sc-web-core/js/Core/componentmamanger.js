SCWeb.core.ComponentType = {
    viewer: 0,
    editor: 1
};

SCWeb.core.ComponentManager = {
    
    _listener: null,
    _initialize_queue: [],
    _componentCount: 0,
    _factories: {},
    
    init: function(callback) {
        // callback will be invoked when all component will be registered
        this._componentCount = this._initialize_queue.length;

        // first of all we need to resolve sc-addrs of formats
        var formats = [];
        for (var i = 0; i < this._initialize_queue.length; i++) {
            formats = formats.concat(this._initialize_queue[i].formats);
        }
        
        var self = this;
        SCWeb.core.Server.resolveScAddr(formats, function(addrs) {
            for (var i = 0; i < self._initialize_queue.length; i++) {
                var comp_def = self._initialize_queue[i];
                
                for (var j = 0; j < comp_def.formats.length; j++) {
                    var fmt = addrs[comp_def.formats[j]];
                    
                    if (fmt) {
                        self.registerFactory(fmt, comp_def.factory);
                    }
                }
            }
            
            callback();
        });
    },
    
    /**
     * Append new component initialize function
     * @param {Object} component_desc Object that define component. It contains such properties as:
     * - formats - Array of system identifiers of supported formats
     * - factory - factory function (@see SCWeb.core.ComponentManager.registerFactory)
     */
    appendComponentInitialize: function(component_def) {
        this._initialize_queue.push(component_def);
    },
    
    /** Register new component factory
     * @param {Array} format_addr sc-addr of supported format
     * @param {Function} func Function that will called on instance reation. If component instance created, then returns true; otherwise returns false.
     * This function takes just one parameter:
     * - sandbox - component sandbox object, that will be used to communicate with component instance
     */
    registerFactory: function(format_addr, func) {
        this._factories[format_addr] = func;
    },
    
    /**
     * Create new instance of component window
     * @param {String} format_addr sc-addr of window format
     * @param {String} container Id of dom object, that will contain window
     * @return Return component sandbox object for created window instance.
     * If window doesn't created, then returns null
     */
    createWindow: function(format_addr, container) {
        var factory = this._factories[format_addr];
        
        if (factory) {
            var sandbox = new SCWeb.core.ComponentSandbox(container);
            if (factory(sanbox))
                return sandbox;
        }
        
        return null;
    },
    
    /**
     * Setup component listener
     * @param {Object} listener Listener object. It must to has functions:
     * - onComponentRegistered - function, that call when new component registered. It receive
     * component description object as argument
     * - onComponentUnregistered - function, that calls after one of the component was unregistered.
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
