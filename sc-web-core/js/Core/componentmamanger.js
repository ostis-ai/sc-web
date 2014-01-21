SCWeb.core.ComponentType = {
    viewer: 0,
    editor: 1
};

SCWeb.core.ComponentManager = {
    
    _listener: null,
    _initialize_queue: [],
    _componentCount: 0,
    _factories: {},
    _ext_langs: {},
    _keynodes: [],      // array of keynodes that requested by components
    
    init: function() {
        var dfd = new jQuery.Deferred();

        // deffered will be resolved when all component will be registered
        this._componentCount = this._initialize_queue.length;

        // first of all we need to resolve sc-addrs of keynodes
        var keynodes = [];
        for (var i = 0; i < this._initialize_queue.length; i++) {
            var c = this._initialize_queue[i];
            keynodes = keynodes.concat(c.formats);
            if (c.getRequestKeynodes) {
                keynodes = keynodes.concat(c.getRequestKeynodes());
            }
            if (this._initialize_queue[i].ext_lang)
                keynodes.push(c.ext_lang);
        }
        
        var self = this;
        SCWeb.core.Server.resolveScAddr(keynodes, function(addrs) {
            
            self._keynodes = addrs;
            for (var i = 0; i < self._initialize_queue.length; i++) {
                var comp_def = self._initialize_queue[i];

                var lang_addr = addrs[comp_def.ext_lang];
                var formats = null;
                if (lang_addr) {
                    formats = [];
                }
                
                for (var j = 0; j < comp_def.formats.length; j++) {
                    var fmt = addrs[comp_def.formats[j]];
                    
                    if (fmt) {
                        self.registerFactory(fmt, comp_def.factory);
                        if (formats) {
                            formats.push(fmt);
                        }
                    }
                }
                
                if (formats) {
                    self._ext_langs[lang_addr] = formats;
                }
            }
            
            dfd.resolve();
        });

        return dfd.promise();
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
     * @param {String} link_addr sc-addr of link, that edit or viewed with sandbox
     * @param {String} container Id of dom object, that will contain window
     * @param {Function} callback Callback function that calls on creation finished
     * @return Return component sandbox object for created window instance.
     * If window doesn't created, then returns null
     */
    createWindowSandbox: function(format_addr, link_addr, container, callback) {
        var dfd = new jQuery.Deferred();
        var factory = this._factories[format_addr];
        
        if (factory) {
            var sandbox = new SCWeb.core.ComponentSandbox(container, link_addr, this._keynodes);
            if (factory(sandbox)) {
                sandbox.getLinkContent(link_addr,
                                        function (data) {
                                            $.when(sandbox.onDataAppend(data)).then(
                                                function() {
                                                    dfd.resolve(sandbox);
                                                },
                                                function() {
                                                    dfd.reject();
                                                }
                                            );
                                        },
                                        function () { dfd.reject(); });
                
            } else throw "Can't create viewer properly"
        } else {        
            dfd.reject();
        }

        return dfd.promise();
    },
    
    /**
     * Returns sc-addr of primary used format for specified external language
     * @param {String} ext_lang_addr sc-addr of external language
     */
    getPrimaryFormatForExtLang: function(ext_lang_addr) {
        var fmts = this._ext_langs[ext_lang_addr];
        
        if (fmts && fmts.length > 0) {
            return fmts[0];
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
