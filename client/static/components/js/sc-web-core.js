$.namespace('SCWeb.core');


SCWeb.core.ComponentType = {
    viewer: 0,
    editor: 1
};

SCWeb.core.ComponentManager = {
    
    _listener: null,
    _initialize_queue: [],
    _componentCount: 0,
    _factories_fmt: {},
    _factories_ext_lang: {},
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

                self._factories_ext_lang[comp_def.ext_lang_addr] = comp_def;
                
                for (var j = 0; j < comp_def.formats.length; j++) {
                    var fmt = addrs[comp_def.formats[j]];
                    
                    if (fmt) {
                        self.registerFactory(fmt, comp_def);
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
        this._factories_fmt[format_addr] = func;
    },
    
    /** Check if compoenent for specified format supports structures
     */
    isStructSupported: function(format_addr) {
        var comp_def = this._factories_fmt[format_addr];
        if (!comp_def)
            throw "There are no component that supports format: " + format_addr;
        
        return comp_def.struct_support;
    },
    
    /**
     * Create new instance of component window
     * @param {String} format_addr sc-addr of window format
     * @param {String} sc-addr of sc-link or sc-structure, that edit or viewed with sandbox
     * @param {Boolean} is_struct if that paramater is true, then addr is an sc-addr of struct;
     * otherwise the last one a sc-addr of sc-link
     * @param {String} container Id of dom object, that will contain window
     * @param {Function} callback Callback function that calls on creation finished
     * @return Return component sandbox object for created window instance.
     * If window doesn't created, then returns null
     */
    createWindowSandbox: function(format_addr, addr, is_struct, container, callback) {
        var dfd = new jQuery.Deferred();
        var comp_def = this._factories_fmt[format_addr];
        
        if (comp_def) {
            var sandbox = new SCWeb.core.ComponentSandbox(container, addr, is_struct, format_addr, this._keynodes);
            if (!comp_def && is_struct)
                throw "Component doesn't support structures: " + comp_def;
            
            if (comp_def.factory(sandbox)) {
                dfd.resolve();
                
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


SCWeb.core.scAddrsDict = {};

/**
 * Create new instance of component sandbox.
 * @param {String} container Id of dom object, that will contain component
 * @param {String} addr sc-addr of sc-link or sc-structure, that edit or viewed with sandbox
 * @param {Boolean} is_struct If that value is true, then addr is a sc-addr to viewed structure; otherwise the last one is a sc-link
 * @param {String} format_addr sc-addr of window format
 * @param {String} ext_lang_addr sc-addr of external language
 * @param {Object} keynodes Dictionary that contains keynode addr by system identifiers
 */
SCWeb.core.ComponentSandbox = function(container, addr, is_struct, format_addr, keynodes) {
    this.container = container;
    this.wrap_selector = '#' + this.container + '_wrap';
    this.addr = addr;
    this.is_struct = is_struct;
    this.format_addr = format_addr;

    this.eventGetObjectsToTranslate = null;
    this.eventApplyTranslation = null;
    this.eventArgumentsUpdate = null;
    this.eventWindowActiveChanged = null;
    this.eventDataAppend = null;
    /* function (added, element, arc)
     * - added - true, when element added; false - element removed
     * - element - sc-addr of added(removed) sc-element
     * - arc - sc-addr of arc that connect struct with element
     */
    this.eventStructUpdate = null;  
    
    this.event_add_element = null;
    this.event_remove_element = null;
    
    this.listeners = [];
    this.keynodes = keynodes;
    
    var self = this;
    this.listeners = [];

    this.createWindowControls();

    // listen arguments
    this.listeners.push(SCWeb.core.EventManager.subscribe("arguments/add", this, this.onArgumentAppended));
    this.listeners.push(SCWeb.core.EventManager.subscribe("arguments/remove", this, this.onArgumentRemoved));
    this.listeners.push(SCWeb.core.EventManager.subscribe("arguments/clear", this, this.onArgumentCleared));
    
    // listen translation
    this.listeners.push(SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation));
    this.listeners.push(SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
        var items = self.getObjectsToTranslate();
        for (var i in items) {
            objects.push(items[i]);
        }
    }));
    
    // listen struct changes
    /// @todo possible need to wait event creation
    if (this.is_struct) {
        window.sctpClient.event_create(SctpEventType.SC_EVENT_ADD_OUTPUT_ARC, this.addr, function(addr, arg) {
            if (self.eventStructUpdate) {
                self.eventStructUpdate(true, addr, arg);
            }
        }).done(function(id) {
            self.event_add_element = id.result;
        });
        window.sctpClient.event_create(SctpEventType.SC_EVENT_REMOVE_OUTPUT_ARC, this.addr, function(addr, arg) {
            if (self.eventStructUpdate) {
                self.eventStructUpdate(false, addr, arg);
            }
        }).done(function(id) {
            self.event_remove_element = id.result;
        });
    }
};

SCWeb.core.ComponentSandbox.prototype = {
    constructor: SCWeb.core.ComponentSandbox
};

// ------------------ Core functions --------------------------
/**
 * Destroys component sandbox
 */
SCWeb.core.ComponentSandbox.prototype.destroy = function() {
    for (var l in this.listeners) {
        SCWeb.core.EventManager.unsubscribe(this.listeners[l]);
    }
    
    /// @todo possible need to wait event destroy
    if (this.event_add_element)
        window.sctpClient.event_destroy(this.event_add_element);
    if (this.event_remove_element)
        window.sctpClient.event_destroy(this.event_remove_element);
};

/**
 * Create controls for window
 */
SCWeb.core.ComponentSandbox.prototype.createWindowControls = function() {
    /*var html = '<button type="button" class="button-menu btn btn-default btn-xs" data-toggle="button"><span class="caret"></span></button>\
                <div class="btn-group-vertical btn-group-xs hidden"> \
                    <button type="button" class="btn btn-success"><span class="glyphicon glyphicon-tags"></span></button> \
                </div>';
    var self = this;
    var controls = $(this.wrap_selector + ' > .sc-content-controls');
    controls.append(html).find('.button-menu').on('click', function() {
        controls.find('.btn-group-vertical').toggleClass('hidden');
    });*/
    
};

// ------------------ Functions to call from component --------

SCWeb.core.ComponentSandbox.prototype.canEdit = function() {
    return true; // @todo: check by user rights
};

/*!
 * @param {Array} args Array of sc-addrs of commnad arguments.
 */
SCWeb.core.ComponentSandbox.prototype.doDefaultCommand = function(args) {
    SCWeb.core.Main.doDefaultCommand(args);
};

/*! Resolves sc-addr for all elements with attribute sc_control_sys_idtf
 */
SCWeb.core.ComponentSandbox.prototype.resolveElementsAddr = function(parentSelector) {
    SCWeb.ui.Core.resolveElementsAddr(parentSelector);
};

/*!
 * Genarate html for new window container
 * @param {String} containerId ID that will be set to container
 * @param {String} classes Classes that will be added to container
 * @param {String} addr sc-addr of window
 */
SCWeb.core.ComponentSandbox.prototype.generateWindowContainer = function(containerId, containerClasses, controlClasses, addr) {

    return SCWeb.ui.WindowManager.generateWindowContainer(containerId, containerClasses, controlClasses, addr);
};

/*! Returns keynode by it system identifier
 * @param {String} sys_idtf System identifier
 * @returns If keynodes exist, then returns it sc-addr; otherwise returns null
 */
SCWeb.core.ComponentSandbox.prototype.getKeynode = function(sys_idtf) {
    var res = this.keynodes[sys_idtf];
    if (res) {
        return res;
    }
    return null;
};

SCWeb.core.ComponentSandbox.prototype.getIdentifiers = function(addr_list, callback) {
    SCWeb.core.Server.resolveIdentifiers(addr_list, callback);
};

SCWeb.core.ComponentSandbox.prototype.getIdentifier = function(addr, callback) {
    SCWeb.core.Server.resolveIdentifiers([addr], function(idtfs) {
        callback(idtfs[addr]);
    });
};

SCWeb.core.ComponentSandbox.prototype.getLinkContent = function(addr, callback_success, callback_error) {
    SCWeb.core.Server.getLinkContent(addr, callback_success, callback_error);
};

SCWeb.core.ComponentSandbox.prototype.resolveAddrs = function(idtf_list, callback) {
    
    var arguments = [];
    var result = {};
    for (idx in idtf_list) {
        var idtf = idtf_list[idx];
        var addr = SCWeb.core.scAddrsDict[idtf];
        if (addr)
            result[idtf] = addr;
        else
            arguments.push(idtf);           
    }
    
    SCWeb.core.Server.resolveScAddr(arguments, function(data) {
        
        for(var key in data) {
            if(data.hasOwnProperty(key))
                SCWeb.core.scAddrsDict[key] = data[key];
        }       
        callback(SCWeb.core.scAddrsDict);
    });
};

/**
 * Create viewers for specified sc-links
 * @param {Object} containers_map Map of viewer containers (key: sc-link addr, value: id of container)
 */
SCWeb.core.ComponentSandbox.prototype.createViewersForScLinks = function(containers_map) {
    return SCWeb.ui.WindowManager.createViewersForScLinks(containers_map);
};

/*! Function takes content of sc-link or sctructure from server and call event handlers
 */
SCWeb.core.ComponentSandbox.prototype.updateContent = function() {
    var dfd = new jQuery.Deferred();
    var self = this;

    if (this.is_struct && this.eventStructUpdate) {
        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                           [
                                                this.addr,
                                                sc_type_arc_pos_const_perm,
                                                0
                                            ])
        .done(function (res) {
            for (idx in res.result)
                self.eventStructUpdate(true, res.result[idx][0], res.result[idx][1]);

            dfd.resolve();
        });
    } else
    {
        this.getLinkContent(this.addr,
            function (data) {
                $.when(self.onDataAppend(data)).then(
                    function() {
                        dfd.resolve();
                    },
                    function() {
                        dfd.reject();
                    }
                );
            },
            function () {
                dfd.reject();
            });
    }
    
    return dfd.promise();
};

// ------ Translation ---------
/**
 * This function returns list of objects, that can be translated.
 * Just for internal usage in core.
 */
SCWeb.core.ComponentSandbox.prototype.getObjectsToTranslate = function() {
    if (this.eventGetObjectsToTranslate)
        return this.eventGetObjectsToTranslate();
        
    return [];
};

/**
 * This function apply translation to component.
 * Just for internal usage in core
 * @param {Object} translation_map Dictionary of translation
 */
SCWeb.core.ComponentSandbox.prototype.updateTranslation = function(translation_map) {
    if (this.eventApplyTranslation)
       this.eventApplyTranslation(translation_map);
};

// ----- Arguments ------
SCWeb.core.ComponentSandbox.prototype._fireArgumentsChanged = function() {
    if (this.eventArgumentsUpdate)
        this.eventArgumentsUpdate(SCWeb.core.Arguments._arguments.slice(0));
};

/**
 * Calls when new argument added
 * @param {String} argument sc-addr of argument
 * @param {Integer} idx Index of argument
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentAppended = function(argument, idx) {
    this._fireArgumentsChanged();
};

/**
 * Calls when new argument removed
 * @param {String} argument sc-addr of argument
 * @param {Integer} idx Index of argument
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentRemoved = function(argument, idx) {
    this._fireArgumentsChanged();
};

/**
 * Calls when arguments list cleared
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentCleared = function() {
    this._fireArgumentsChanged();
};

// --------- Window -----------
SCWeb.core.ComponentSandbox.prototype.onWindowActiveChanged = function(is_active) {
    if (this.eventWindowActiveChanged)
        this.eventWindowActiveChanged(is_active);
};

// --------- Data -------------
SCWeb.core.ComponentSandbox.prototype.onDataAppend = function(data) {
    var dfd = new jQuery.Deferred();

    if (this.eventDataAppend)
    {
        var self = this;
        $.when(this.eventDataAppend(data)).then(
            function() {
                $.when(SCWeb.core.Translation.translate(self.getObjectsToTranslate())).done(
                    function(namesMap) {
                        self.updateTranslation(namesMap);
                        dfd.resolve();
                    });
                //dfd.resolve();
            },
            function() {
                dfd.reject();
            });
        
    } else {
        dfd.resolve();
    }

    return dfd.promise();
};


SCWeb.core.EventManager = {
    
    events: {},
    
    /**
     * Subscribe handler for specified event
     * @param {String} evt_name Event name
     * @param {Object} context Context to call callback function
     * @param {callback} callback Callback function
     * @returns Returns event object
     */
    subscribe: function(evt_name, context, callback) {
        
        var event = {
            event_name: evt_name,
            func: callback,
            context: context
        };
        
        if (!this.events[evt_name]) {
            this.events[evt_name] = [event];
        } else {            
            this.events[evt_name].push(event);
        }
        
        return event;
    },
    
    /**
     * Remove subscription
     * @param {Object} event Event object
     */
    unsubscribe: function(event) {
        
        for(var evt in this.events) {
            var funcs = this.events[evt];
            var idx = funcs.indexOf(event);
            if (idx >= 0) {
                funcs.splice(idx, 1);
            }
        }   
    },
    
    /**
     * Emit specified event with params
     * First param - is an event name. Other parameters will be passed into callback
     */
    emit: function() {
        
        var params = Array.prototype.slice.call(arguments);
        var evt = params.splice(0, 1);
        
        var funcs = this.events[evt];
        if (funcs) {
            for (var f in funcs) {
                var e_obj = funcs[f];
                e_obj.func.apply(e_obj.context, params);
            }
        }
    }
};


// sc-element types
var sc_type_node = 0x1
var sc_type_link = 0x2
var sc_type_edge_common = 0x4
var sc_type_arc_common = 0x8
var sc_type_arc_access = 0x10

// sc-element constant
var sc_type_const = 0x20
var sc_type_var = 0x40

// sc-element positivity
var sc_type_arc_pos = 0x80
var sc_type_arc_neg = 0x100
var sc_type_arc_fuz = 0x200

// sc-element premanently
var sc_type_arc_temp = 0x400
var sc_type_arc_perm = 0x800

// struct node types
var sc_type_node_tuple = (0x80)
var sc_type_node_struct = (0x100)
var sc_type_node_role = (0x200)
var sc_type_node_norole = (0x400)
var sc_type_node_class = (0x800)
var sc_type_node_abstract = (0x1000)
var sc_type_node_material = (0x2000)


var sc_type_arc_pos_const_perm = (sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm)

// type mask
var sc_type_element_mask = (sc_type_node | sc_type_link | sc_type_edge_common | sc_type_arc_common | sc_type_arc_access)
var sc_type_constancy_mask = (sc_type_const | sc_type_var)
var sc_type_positivity_mask = (sc_type_arc_pos | sc_type_arc_neg | sc_type_arc_fuz)
var sc_type_permanency_mask = (sc_type_arc_perm | sc_type_arc_temp)
var sc_type_node_struct_mask = (sc_type_node_tuple | sc_type_node_struct | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material)
var sc_type_arc_mask = (sc_type_arc_access | sc_type_arc_common | sc_type_edge_common)



/**
 * Object controls list of command parameters.
 * It can fires next events:
 * - "arguments/add" - this event emits on new argument add. Parameters: arg, idx 
 * where:
 * 		- arg - is a sc-addr of object that added as argument;
 * 		- idx - is an index of the argument
 * - "arguments/remove" - this event emits on argument remove. Parameters: arg, idx
 * where:
 * 		- arg - is a sc-addr of object that removed from arguments;
 * 		- idx - is an index of the argument
 * - "arguments/clear" - this event emits on arguments clear (all arguments removed at once)
 */
SCWeb.core.Arguments = {

    _arguments : [],

    /**
     * Append new argument into the end of list
     *
     * @param {String}
     * argument SC-addr of command argument
     * @return Returns index of appended argument
     */
    appendArgument : function(argument) {

        this._arguments.push(argument);

        var idx = this._arguments.length - 1;
        this._fireArgumentAppended(argument, idx);

        return idx;
    },

    /**
     * Removes first occurrence of specified argument
     *
     * @param {String}
     * argument SC-add of argument to remove
     */
    removeArgument : function(argument) {

        var idx = this._arguments.indexOf(argument);

        if (idx >= 0) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);

            this._fireArgumentAppended(arg, idx);
        }
    },

    /**
     * Remove argument by specified index
     *
     * @param {Number}
     * idx Index of argument to remove
     */
    removeArgumentByIndex : function(idx) {

        if (idx < this._arguments.length) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);

            this._fireArgumentRemoved(arg, idx);
        }
    },

    /**
     * Clears arguments list
     */
    clear : function() {

        this._arguments = [];
        this._fireArgumentCleared();
    },

    /**
     * Notify listener on argument added
     *
     * @param {String}
     * argument Argument, that was added *
     * @param {Number}
     * Index of added argument
     */
    _fireArgumentAppended : function(argument, idx) {

        SCWeb.core.EventManager.emit("arguments/add", argument, idx);
    },

    /**
     * Notify listener on argument removed
     *
     * @param {String}
     * argument Argument, that was removed
     * @param {Number}
     * Index of removed argument
     */
    _fireArgumentRemoved : function(argument, idx) {

        SCWeb.core.EventManager.emit("arguments/remove", argument, idx);
    },

    /**
     * Notify listener on argument clear
     */
    _fireArgumentCleared : function() {

        SCWeb.core.EventManager.emit("arguments/clear");
    },

    /**
     * Retrieves all available arguments to caller object.
     *
     * @returns {Array} the array of available arguments.
     */
    getArguments : function() {

        return this._arguments;
    }

};


SCWeb.core.Server = {
    _semanticNeighborhood: {
        commandId: 'ui_menu_view_full_semantic_neighborhood',
        commandAddr: null
    },
    
    _listeners: [],
    _task_queue: [], // array of server tasks
    _task_active_num: 0, // number of active tasks
    _task_max_active_num: 10, // maximum number of active tasks
    _task_timeout: 0, // timer id for tasks queue
    _task_frequency: 100,   // task timer frequency

    _current_language: null,
    _identifiers_cache: null,
    _sys_identifiers_cache: null,

    _initialize: function() {
        var expire = 1000 * 60 * 5; // five minutes expire
        this._identifiers_cache = new AppCache({
                expire: expire,
                max: 3000
        });

        this._sys_identifiers_cache = new AppCache({
                expire: expire,
                max: 3000
        });

        SCWeb.core.EventManager.subscribe("translation/changed_language", this, function(lang_addr) {
            SCWeb.core.Server._current_language = lang_addr;
        });
    },

    /*!
     * Append new listener to server tasks
     * @param {Object} listener Listener object.
     * It must have such functions as:
     * - taskStarted - function that calls on new task started. No any arguments
     * - taskFinished - function that calls on new task finished. No any arguments
     */
    appendListener: function(listener) {
        if (this._listeners.indexOf(listener) == -1) {
            this._listeners.push(listener);
        }
    },
    
    /*!
     * Removes specified listener
     * @param {Object} listener Listener object to remove
     */
    removeListener: function(listener) {
        var idx = this._listeners.indexOf(listener);
        if (idx >= 0) {
            this._listeners.splice(idx, 1);
        }
    },
    
    /*!
     * Notify all registere listeners task started
     */
    _fireTaskStarted: function() {
        for (var i = 0; i < this._listeners.length; ++i) {
            $.proxy(this._listeners[i].taskStarted(), this._listeners[i]);
        }
    },
    
    /*!
     * Notify all registered listeners on task finished
     */
    _fireTaskFinished: function() {
        for (var i = 0; i < this._listeners.length; ++i) {
            $.proxy(this._listeners[i].taskFinished(), this._listeners[i]);
        }
    },
    
    /*!
     * Push new task for processing
     * @param {Object} task Object, that represents server task.
     * It contains properties such as:
     * - type - Type of ajax request (GET/POST)
     * - url - Url to call on server
     * - data - Object, that contains request parameters
     * - success - Callback function to call on success
     * - error - Callback function to call on error
     */
    _push_task: function(task) {
        this._fireTaskStarted();
        this._task_queue.push(task);
        
        if (!this._task_timeout) {
            var self = this;
            this._task_timeout = window.setInterval(function() {
                    var tasks = self._pop_tasks();
                    
                    for (idx in tasks) {
                        var task = tasks[idx];
                        self._task_active_num++;
                        $.ajax({
                            url: task.url,
                            data: task.data,
                            type: task.type,
                            success: task.success,
                            error: task.error,
                            complete: function() {
                                SCWeb.core.Server._fireTaskFinished();
                                self._task_active_num--;
                            }
                        });
                    }
                    
                }, this._task_frequency)
        }
    },
    
    /**
     * Get tasks from queue for processing.
     * It returns just tasks, that can be processed for that moment.
     * Number of returned tasks is min(_task_max_active_num - _task_active_num, _task_queue.length)
     */
    _pop_tasks: function() {
        var task_num = this._task_max_active_num - this._task_active_num;
        var res = [];
        for (var i = 0; i < Math.min(task_num, this._task_queue.length); ++i) {
            res.push(this._task_queue.shift());
        }
        
        if (this._task_queue.length == 0) {
            window.clearInterval(this._task_timeout);
            this._task_timeout = 0;
        }
        
        return res;
    },
    
    // ----------------------
    
    /*!
     * Get initial data from server
     *
     * @param {Function} callback Calls on request finished successfully. This function
     * get recieved data from server as a parameter
     */
    init: function(callback) {
        $.ajax({
                url: '/api/user/',
                data: null,
                type: 'GET',
                success: function(user) {
                    window.scHelper.getMainMenuCommands(window.scKeynodes.ui_main_menu).done(function(menu_commands) {
                        var data = {};
                        data['menu_commands'] = menu_commands;
                        data['user'] = user;
                        
                        window.scHelper.getLanguages().done(function(langs) {
                            data['languages'] = langs;
                            
                            window.scHelper.getOutputLanguages().done(function(out_langs) {
                                data['external_languages'] = out_langs;
                                callback(data);
                            });
                        });
                    });
                }
        });        
    },

    /*!
     *
     * @param {Array} objects List of sc-addrs to resolve identifiers
     * @param {Function} callback
     */
    resolveIdentifiers: function(objects, callback) {
        
        if (objects.length == 0) {
            callback({});
            return; // do nothing
        }

        var self = this;
        function getKey(addr) {
            return self._current_language + '/' + addr;
        }

        var result = {}, used = {}, need_resolve = [];

        for(i in objects) {
            var id = objects[i];
            
            if (used[id]) continue; // skip objects, that was processed
            used[id] = true;
            
            var cached = this._identifiers_cache.get(getKey(id));
            if (cached) {
                if (cached !== '.') {
                    result[id] = cached;
                }
                continue;
            }
            
            need_resolve.push(id);
        }
        
        if (need_resolve.length == 0) { // all results cached
            callback(result);
        } else {
            (function(result, need_resolve, callback) {
                
                var resolve_idtf = function() {
                    if (need_resolve.length == 0) {
                        callback(result);
                    } else {
                        var addr = need_resolve.shift();
                        window.scHelper.getIdentifier(addr, self._current_language)
                            .done(function (v) {
                                if (v) {
                                    result[addr] = v;
                                    self._identifiers_cache.set(getKey(addr), v ? v : '.');
                                }

                                resolve_idtf();
                            })
                            .fail(function() {
                                resolve_idtf();
                            });
                    }
                }
                
                resolve_idtf();
                
            })(result, need_resolve, callback);
        }
    },
    
    /*! Function to initiate user command on server
     * @param {cmd_addr} sc-addr of command
     * @param {output_addr} sc-addr of output language
     * @param {arguments_list} List that contains sc-addrs of command arguments
     * @param {callback} Function, that will be called with recieved data
     */
    doCommand: function(cmd_addr, arguments_list, callback){
    
        var arguments = {};
        for (var i = 0; i < arguments_list.length; i++){
            var arg = arguments_list[i];
            arguments[i.toString() + '_'] = arg;
        }
        arguments['cmd'] = cmd_addr;

        this._push_task({
            type: "POST",
            url: "api/cmd/do/",
            data: arguments,
            success: callback
        });
    },
    
    /*! Function to get answer translated into specified format
     * @param {question_addr} sc-addr of question to get answer translated
     * @param {format_addr} sc-addr of format to translate answer
     * @param {callback} Function, that will be called with received data in specified format
     */
    getAnswerTranslated: function(question_addr, format_addr, callback)
    {
        this._push_task({
            type: "POST",
            url: "api/question/answer/translate/",
            data: { "question": question_addr, "format": format_addr },
            success: callback
        });
    },

    
    /*!
     * Function that resolve sc-addrs for specified sc-elements by their system identifiers
     * @param {identifiers} List of system identifiers, that need to be resolved
     * @param {callback} Callback function that calls, when sc-addrs resovled. It
     * takes object that contains map of resolved sc-addrs as parameter
     */
    resolveScAddr: function(idtfList, callback) {
        var self = this, arguments = '', need_resolve = [], result = {}, used = {};

        for (i = 0; i < idtfList.length; i++) {
            var arg = idtfList[i];
            
            var cached = this._sys_identifiers_cache.get(arg);
            if (cached) {
                result[arg] = cached;
                continue;
            }
            
            if (used[arg]) continue;
            used[arg] = true;
            
            arguments += need_resolve.length.toString() + '_=' + arg + '&';
            need_resolve.push(arg);
        }

        if (need_resolve.length == 0) {
            callback(result);
        } else {
            (function(result, arguments, need_resolve, callback) {
                self._push_task({
                    type: "POST",
                    url: "api/addr/resolve/",
                    data: arguments,
                    success: function(addrs) {
                        for (i in need_resolve) {
                            var key = need_resolve[i];
                            var addr = addrs[key];
                            if (addr) {
                                self._sys_identifiers_cache.set(key, addr);
                                result[key] = addr;
                            }
                        }
                        callback(result);
                    }
                });
            })(result, arguments, need_resolve, callback);
        }
    },
    
    /*!
     * Function that get sc-link data from server
     * @param {Array} links List of sc-link addrs to get data
     * @param {Function} success Callback function, that recieve map of
     * resolved sc-links format (key: sc-link addr, value: format addr).
     * @param {Function} error Callback function, that calls on error
     */
    getLinksFormat: function(links, success, error) {
        var arguments = '';
        for (i = 0; i < links.length; i++){
            var arg = links[i];
            arguments += i.toString() + '_=' + arg + '&';
        }
        
        this._push_task({
            type: "POST",
            url: "api/link/format/",
            data: arguments,
            success: success
        });
    },
        
    /**
     * Returns data of specified content
     * @param {String} addr sc-addr of sc-link to get data
     * @param {Function} callback Callback function, that recieve data.
     * @param {Function} error Callback function, that calls on error
     */
    getLinkContent: function(addr, success, error) {
        this._push_task({
                url: "api/link/content/",
                type: "GET",
                data: {"addr": addr},
                success: success,
                error: error
            });
    },
    
    /**
     * Returns list of available natural languages
     */
    getLanguages: function(callback) {
        this._push_task({
            url: "api/languages/",
            type: "GET",
            data: null,
            success: callback
        });
    },
    
    /**
     * Setup default natular language for user
     * @param {String} lang_addr sc-addr of new language to setup
     */
    setLanguage: function(lang_addr, callback) {
        this._push_task({
            url: "api/languages/set/",
            type: "POST",
            data: {"lang_addr": lang_addr},
            success: callback
        });
    },

    /** 
     * Request identifiers that contains specified substring
     * @param str Substring to find
     */
    findIdentifiersSubStr: function(str, callback) {

        $.ajax({
            url: "api/idtf/find/",
            data: {"substr": str},
            type: "GET",
            success: callback
        });
    },

    /**
     * Request tooltip content for specified sc-elements
     */
    getTooltips: function(addrs, success, error) {
        var arguments = '';
        for (i = 0; i < addrs.length; i++){
            var arg = addrs[i];
            arguments += i.toString() + '_=' + arg + '&';
        }
        
         $.ajax({
            type: "POST",
            url: "api/info/tooltip/",
            data: arguments,
            success: success,
            error: error
        });
    }
};




/**
 * This object conrols available modes for natural languages (russina, english ant etc.)
 * It can fires next events:
 * - "translation/update" - this event emits on mode changed. Parameter: dictionary, that contains new translation
 * - "translation/get" - this event emits to collect all objects for translate. Parameter: array, that need to be filled by listener 
 * - "translation/changed_language" - this event emits, when current language changed. Parameter: sc-addr of current language
 * - "translation/change_language_start" - this event emits on language change start. Parameter: empty
 * (this array couldn't be cleared, listener just append new elements).
 */
SCWeb.core.Translation = {
    
    listeners: [],
    current_lang: null,

    /** Updates all translations
     */
    update: function() {
        var dfd = new jQuery.Deferred();

        // collect objects, that need to be translated
        var objects = this.collectObjects();
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        $.when(this.translate(objects)).then(
            function(namesMap) {
                self.fireUpdate(namesMap);
                dfd.resolve();
            },
            function() {
                dfd.reject(); 
            });
        
        return dfd.promise();
     },
      
    /**
     * Do translation routines. Just for internal usage.
     * @param {Array} objects List of sc-addrs, that need to be translated
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function(objects) {
        var dfd = new jQuery.Deferred();

        var self = this;
        SCWeb.core.Server.resolveIdentifiers(objects, function(namesMap) {
            dfd.resolve(namesMap);
        });

        return dfd.promise();
    },
    
    /** Change translation language
     * @param {String} lang_addr sc-addr of language to translate
     * @param {Function} callback Callbcak function that will be called on language change finish
     */
    setLanguage: function(lang_addr, callback) {
        var self = this;
        SCWeb.core.Server.setLanguage(lang_addr, function() {
            self.fireLanguageChanged(lang_addr);
            $.when(self.translate(self.collectObjects())).done(function (namesMap) {
                self.fireUpdate(namesMap);
                callback();
            });
        });
    },
    
    /** Fires translation update event
     * @param {Dict} namesMap Dictionary that contains translations
     */
    fireUpdate: function(namesMap) {
        // notify listeners for new translations
        SCWeb.core.EventManager.emit("translation/update", namesMap);
    },

    fireLanguageChanged: function(lang_addr) {
        SCWeb.core.EventManager.emit("translation/changed_language", lang_addr);
    },

    /** Collect objects for translation
     */
    collectObjects: function() {
        var objects = [];
        SCWeb.core.EventManager.emit("translation/get", objects);
        return objects;
    },
    
    /** Request to translate objects
     * @param {Array} objects Array of objects to translate
     */
    requestTranslate: function(objects) {
        var self = this;
        this.translate(objects, function(namesMap) {
            self.fireUpdate(namesMap);
        });
    }
    
};


SCWeb.core.ErrorCode = {
	Unknown: 0,
	ItemNotFound: 1,
	ItemAlreadyExists: 2
};

SCWeb.core.Debug = {
	
	code_map: {
				0: "Unknown",
				1: "ItemNotFound",
				2: "ItemAlreadyExists"
				},
	
	
	codeToText: function(code) {
		return this.code_map[code];
	},
	
	/**
	 * Function to call, when any error occurs
	 * @param {SCWeb.core.ErrorCode} code Code of error (error type)
	 * @param 
	 */
	error: function(code, message) {
		console.log("Error: " + this.codeToText(code) + ". " + message);
	}
};


var scHelper = null;
var scKeynodes = null; 


SCWeb.core.Main = {
    
    window_types: [],
    idtf_modes: [],
    menu_commands: {},
    default_cmd_str: "ui_menu_view_full_semantic_neighborhood",
    
    /**
     * Initialize sc-web core and ui
     * @param {Object} params Initializetion parameters.
     * There are required parameters:
     * - menu_container_id - id of dom element, that will contains menu items
     */
    init: function(params) {
        var dfd = new jQuery.Deferred();

        var self = this;
        //SCWeb.ui.Locker.show();

        SCWeb.core.Server._initialize();
        SctpClientCreate().done(function(client) {
        
        window.sctpClient = client;
        window.scHelper = new ScHelper(window.sctpClient);
        window.scKeynodes = new ScKeynodes(window.scHelper);

        window.scKeynodes.init().done(function() {
            window.scHelper.init().done(function() {

                    $.when(SCWeb.ui.TaskPanel.init()).done(function() {
                        SCWeb.core.Server.init(function(data) {
                            self.menu_commands = data.menu_commands;
                            self.user = data.user;

                            data.menu_container_id = params.menu_container_id;

                            SCWeb.core.Translation.fireLanguageChanged(self.user.current_lang);

                            $.when(SCWeb.ui.Core.init(data),
                                SCWeb.core.ComponentManager.init(),
                                SCWeb.core.Translation.update()
                                )
                            .done(function() {
                                    dfd.resolve();
                                
                                    var url = parseURL(window.location.href);

                                    if (url.searchObject) {
                                        var question = url.searchObject['question'];
                                        if (question) {
                                            /// @todo Check question is realy a question
                                            SCWeb.ui.WindowManager.appendHistoryItem(question);
                                            return;
                                        }
                                    }

                                    SCWeb.core.Server.resolveScAddr([params.default_keynode], function(addrs) {
                                        var argumentAddr = addrs[params.default_keynode];
                                        //var window = SCWeb.core.ui.Windows.createWindow(outputAddr);
                                        SCWeb.core.Main.doDefaultCommand([argumentAddr]);
                                        if (params.first_time)
                                            $('#help-modal').modal({"keyboard": true});
                                    });
                
                                
                            });
                        });
                    });
                });

            });
        });
            
        
       
        
        return dfd.promise();
    },

    _initUI: function() {

    },
    
    /**
     * Returns sc-addr of preffered output language for current user
     */
    getDefaultExternalLang: function() {
        return this.user.default_ext_lang;
    },
    
    /**
     * Initiate user interface command
     * @param {String} cmd_addr sc-addr of user command
     * @param {Array} cmd_args Array of sc-addrs with command arguments
     */
    doCommand: function(cmd_addr, cmd_args) {
        SCWeb.core.Server.doCommand(cmd_addr, cmd_args, function(result) {
            if (result.question != undefined) {
                SCWeb.ui.WindowManager.appendHistoryItem(result.question);
            }
        });
    },
    
    /**
     * Initiate default user interface command
     * @param {Array} cmd_args Array of sc-addrs with command arguments
     */
    doDefaultCommand: function(cmd_args) {
        if (!this.default_cmd) {
            var self = this;
            SCWeb.core.Server.resolveScAddr([this.default_cmd_str], function(addrs) {
                self.default_cmd = addrs[self.default_cmd_str];
                if (self.default_cmd) {
                    self.doCommand(self.default_cmd, cmd_args);
                }
            });
        } else {
            this.doCommand(this.default_cmd, cmd_args);
        }
    },
    
};



$.namespace('SCWeb.ui');


SCWeb.ui.Locker = {
    counter: 0,

    update: function() {
        if (this.counter < 0) throw "Counter of ui locker less than 0";

        if (this.counter > 0) {
            $('#sc-ui-locker').addClass('shown');
        } else {
            $('#sc-ui-locker').removeClass('shown');
        }
    },

    show: function() {
        this.counter++;
        this.update();
    },

    hide: function() {
        this.counter--;
        this.update();
    }
};


SCWeb.ui.SearchPanel = {
    
    init: function() {
        var dfd = new jQuery.Deferred();
        var self = this;

        var keynode_nrel_main_idtf = null;
        var keynode_nrel_idtf = null;
        var keynode_nrel_system_idtf = null;

        $('.typeahead').typeahead({
                minLength: 3,
                highlight: true,
            },
            {
                name: 'idtf',
                source: function(query, cb) {
                    $('#search-input').addClass('search-processing');
                    SCWeb.core.Server.findIdentifiersSubStr(query, function(data) {
                        keys = [];
                        for (key in data) {
                            var list = data[key];
                            for (idx in list) {
                                var value = list[idx]
                                keys.push({name: value[1], addr: value[0], group: key});
                            }
                        }

                        cb(keys);
                        $('#search-input').removeClass('search-processing');
                    });
                },
                displayKey: 'name',
                templates: {
                    suggestion: function(item) {

                        //glyphicon glyphicon-globe
                        var html = '';
                        if (item.group === keynode_nrel_idtf) {
                            return '<p class="sc-content">' + item.name + '</p>';
                        } else {
                            var cl = 'glyphicon glyphicon-user';
                            if (item.group === keynode_nrel_system_idtf) {
                                cl = 'glyphicon glyphicon-globe';
                            }
                            return '<p><span class="tt-suggestion-icon ' + cl + '"></span>' + item.name + '</p>';
                        }
                        return '<p>' + item.name + '</p>';
                    }
                }
            }
        ).bind('typeahead:selected', function(evt, item, dataset) {
            if (item && item.addr) {
                SCWeb.core.Main.doDefaultCommand([item.addr]);
            }
            evt.stopPropagation();
            $('.typeahead').val('');
        });

        SCWeb.core.Server.resolveScAddr(['nrel_main_idtf', 'nrel_idtf', 'nrel_system_identifier'], function(addrs) {
            keynode_nrel_main_idtf = addrs['nrel_main_idtf'];
            keynode_nrel_idtf = addrs['nrel_idtf'];
            keynode_nrel_system_idtf = addrs['nrel_system_identifier'];

            dfd.resolve();
        });

        return dfd.promise();
    },
    
};


SCWeb.ui.UserPanel = {
    
    /*!
     * Initialize user panel.
     * @param {Object} params Parameters for panel initialization.
     * There are required parameters:
     * - sc_addr - sc-addr of user
     * - is_authenticated - flag that have True value, in case when user is authenticated
     * - current_lang - sc-addr of used natural language
     */
    init: function(params) {
        var dfd = new jQuery.Deferred();

        this.is_authenticated = params.user.is_authenticated;
        this.user_sc_addr = params.user.sc_addr;
        this.lang_mode_sc_addr = params.user.current_lang;
        this.default_ext_lang_sc_addr = params.user.default_ext_lang
        
        if (this.is_authenticated) {
            $('#auth-user-name').attr('sc_addr', this.user_sc_addr).text(this.user_sc_addr);
            $('#auth-user-lang').attr('sc_addr', this.lang_mode_sc_addr).text(this.lang_mode_sc_addr);
            $('#auth-user-ext-lang').attr('sc_addr', this.default_ext_lang_sc_addr).text(this.default_ext_lang_sc_addr);
        }
        
        // listen translation events
        SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
            $('#auth-user-panel [sc_addr]').each(function(index, element) {
                objects.push($(element).attr('sc_addr'));
            });
        });
                
        dfd.resolve();
        return dfd.promise();
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#auth-user-panel [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr].replace('user::', '').replace('session::', ''));
            }
        });
        
    },


};


SCWeb.ui.WindowManager = {
    
    // dictionary that contains information about windows corresponding to history items
    windows: [],
    window_count: 0,
    window_active_formats: {},
    sandboxes: {},
    active_window_id: null,
    active_history_addr: null,
    
    
    // function to create hash from question addr and format addr
    hash_addr: function(question_addr, fmt_addr) {
        return question_addr + '_' + fmt_addr;
    },
    
    init: function(params) {
        var dfd = new jQuery.Deferred();
        this.ext_langs = params.external_languages;
        
        this.history_tabs_id = '#history-items';
        this.history_tabs = $(this.history_tabs_id);
        
        this.window_container_id = '#window-container';
        this.window_container = $(this.window_container_id);
        
        var self = this;
        
        // external language
        var ext_langs_items = '';
        for (idx in this.ext_langs) {
            var addr = this.ext_langs[idx];
            ext_langs_items += '<li><a href="#" sc_addr="' + addr + '">' + addr + '</a></li>';
        }
        $('#history-item-langs').html(ext_langs_items).find('[sc_addr]').click(function(event) {

            if (SCWeb.ui.ArgumentsPanel.isArgumentAddState()) return;

            var question_addr = self.active_history_addr;
            var lang_addr = $(this).attr('sc_addr');
        
            var fmt_addr = SCWeb.core.ComponentManager.getPrimaryFormatForExtLang(lang_addr);
            if (fmt_addr) {
                var id = self.hash_addr(question_addr, fmt_addr);
                if (self.windows.indexOf(id) != -1) {
                    self.setWindowActive(id);
                } else {
                    self.appendWindow(question_addr, fmt_addr);
                    self.window_active_formats[question_addr] = fmt_addr;
                    self.windows[self.hash_addr(question_addr, fmt_addr)] = question_addr;
                }
            }
        });
    
        $('#history-item-print').click(function () {
            if (SCWeb.ui.ArgumentsPanel.isArgumentAddState()) return;

            // get ctive window data
            var data = self.window_container.find("#" + self.active_window_id).html();
            
            var html = '<html><head>' + $('head').html() + '</head></html><body>' + data + '</body>';
            var styles = '';

            var DOCTYPE = "<!DOCTYPE html>"; // your doctype declaration
            var printPreview = window.open('about:blank', 'print_preview');
            var printDocument = printPreview.document;
            printDocument.open();
            printDocument.write(DOCTYPE +
                    '<html>' +
                        '<head>' + styles + '</head>' +
                        '<body class="print-preview">' + html + '</body>' +
                    '</html>');
            printDocument.close();
        });
        
        $('#history-item-link').popover( {
            content: $.proxy(self.getUrlToCurrentWindow, self)
        });
        
        // listen translation events
        SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
            $('#history-container [sc_addr]').each(function(index, element) {
                objects.push($(element).attr('sc_addr'));
            });
        });
        
        dfd.resolve();
        return dfd.promise();
    },
    
    getUrlToCurrentWindow: function() {
        return window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/?question=" + this.active_history_addr;
    },
    
    // ----------- History ------------
    /**
     * Append new tab into history
     * @param {String} question_addr sc-addr of item to append into history
     */
    appendHistoryItem: function(question_addr) {
        
        // @todo check if tab exist        
        var tab_html = '<a class="list-group-item history-item" sc_addr="' + question_addr + '">' +
                            '<p>' + question_addr + '</p>' +
                        '</a>';

        this.history_tabs.prepend(tab_html);
                
        // get translation and create window
        var ext_lang_addr = SCWeb.core.Main.getDefaultExternalLang();
        var fmt_addr = SCWeb.core.ComponentManager.getPrimaryFormatForExtLang(ext_lang_addr);
        if (fmt_addr) {
            var id = this.hash_addr(question_addr, fmt_addr)
            if (this.windows.indexOf(id) != -1) {
                this.setWindowActive(id);
            } else {            
                this.appendWindow(question_addr, fmt_addr);
                this.window_active_formats[question_addr] = fmt_addr;
            }
        }
        
        this.setHistoryItemActive(question_addr);
                
        // setup input handlers
        var self = this;
        this.history_tabs.find("[sc_addr]").click(function(event) {
            var question_addr = $(this).attr('sc_addr');
            self.setHistoryItemActive(question_addr);
            self.setWindowActive(self.hash_addr(question_addr, self.window_active_formats[question_addr]));
        });

        // translate added item
        $.when(SCWeb.core.Translation.translate([ question_addr ])).done(function(namesMap) {
            value = namesMap[question_addr];
            if (value) {
                $(self.history_tabs_id + " [sc_addr='" + question_addr + "']").text(value);
            }
        });
    },
    
    /**
     * Removes specified history item
     * @param {String} addr sc-addr of item to remove from history
     */
    removeHistoryItem: function(addr) {
        this.history_tabs.find("[sc_addr='" + addr + "']").remove();
    },
    
    /**
     * Set new active history item
     * @param {String} addr sc-addr of history item
     */
    setHistoryItemActive: function(addr) {
        if (this.active_history_addr) {
            this.history_tabs.find("[sc_addr='" + this.active_history_addr + "']").removeClass('active').find('.histoy-item-btn').addClass('hidden');
        }
        
        this.active_history_addr = addr;
        this.history_tabs.find("[sc_addr='" + this.active_history_addr + "']").addClass('active').find('.histoy-item-btn').removeClass('hidden');
    },
    

    // ------------ Windows ------------
    /**
     * Append new window
     * @param {String} addr sc-addr of sc-structure
     * @param {String} fmt_addr sc-addr of window format
     */
    appendWindow: function(question_addr, fmt_addr) {
        var self = this;
        
        var f = function(addr, is_struct) {
            var id = self.hash_addr(question_addr, fmt_addr);
            var window_id = 'window_' + question_addr;
            var window_html =   '<div class="panel panel-default sc-window" id="' + id + '" sc_addr="' + question_addr + '" sc-addr-fmt="' + fmt_addr + '">' +
                                    '<div class="panel-body" id="' + window_id + '"></div>'
                                '</div>';
            self.window_container.prepend(window_html);

            self.hideActiveWindow();
            self.windows.push(id);
            
            var sandbox = SCWeb.core.ComponentManager.createWindowSandbox(fmt_addr, addr, is_struct, window_id);
            if (sandbox) {
                self.sandboxes[question_addr] = sandbox;
                self.setWindowActive(id);
            } else {
                self.showActiveWindow();
                throw "Error while create window";
            };
        };
        
        var translated = function() {
            SCWeb.core.Server.getAnswerTranslated(question_addr, fmt_addr, function(d) {
                f(d.link, true);
            });
        };
        
        if (SCWeb.core.ComponentManager.isStructSupported(fmt_addr)) {
            // determine answer structure
            window.scHelper.getAnswer(question_addr).done(function (addr) {
                f(addr, true);
            }).fail(function(v) {
                translated();
            });
        } else
            translated();
    },
    
    /**
     * Remove specified window
     * @param {String} addr sc-addr of window to remove
     */
    removeWindow: function(id) {
        this.window_container.find("[sc_addr='" + addr + "']").remove();
    },
    
    /**
     * Makes window with specified addr active
     * @param {String} addr sc-addr of window to make active
     */
    setWindowActive: function(id) {
        this.hideActiveWindow();
        
        this.active_window_id = id;
        this.showActiveWindow();
    },

    hideActiveWindow: function() {
        if (this.active_window_id)
            this.window_container.find("#" + this.active_window_id).addClass('hidden');
    },

    showActiveWindow: function() {
        if (this.active_window_id)
            this.window_container.find("#" + this.active_window_id).removeClass('hidden'); 
    },

    /*!
     * Genarate html for new window container
     * @param {String} containerId ID that will be set to container
     * @param {String} controlClasses Classes that will be added to controls
     * @param {String} containerClasses Classes that will be added to container
     * @param {String} addr sc-addr of window
     */
    generateWindowContainer: function(containerId, containerClasses, controlClasses, addr) {

        return '<div class="sc-content-wrap" id="' + containerId + '_wrap"> \
                    <div class="sc-content-controls ' + controlClasses + '" sc_addr="' + addr + '"> </div> \
                    <div id="' + containerId + '" class="sc-content ' + containerClasses + '"> </div> \
                </div>';
    },

    /**
     * Create viewers for specified sc-links
     * @param {Object} containers_map Map of viewer containers (key: sc-link addr, value: id of container)
     */
    createViewersForScLinks: function(containers_map) {
        var dfd = new jQuery.Deferred();

        var linkAddrs = [];
        for (var cntId in containers_map)
                linkAddrs.push(containers_map[cntId]);

        if (linkAddrs.length == 0) {
            dfd.resolve();
            return dfd.promise();
        }
        
        (function(containers_map) {
            SCWeb.core.Server.getLinksFormat(linkAddrs,
                function(formats) {
                    
                    var result = {};

                    for (var cntId in containers_map) {
                        var addr = containers_map[cntId];
                        var fmt = formats[addr];
                        if (fmt) {
                            var sandbox = SCWeb.core.ComponentManager.createWindowSandbox(fmt, addr, false, cntId);
                            if (sandbox) {
                                result[addr] = sandbox;
                            }
                        }
                    }
                    
                    dfd.resolve();
                },
                function() {
                    dfd.reject();
                }
            );
        })(containers_map);
        
        return dfd.promise();
    },

    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#history-container [sc_addr]:not(.btn)').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
        
    },
};


SCWeb.ui.ArgumentsPanel = {
    _container : '#arguments_buttons',

    init : function() {
        this.argument_add_state = false;
        var dfd = new jQuery.Deferred();

        var self = this;
        // listen events from arguments
        SCWeb.core.EventManager.subscribe("arguments/add", this, this.onArgumentAppended);
        SCWeb.core.EventManager.subscribe("arguments/remove", this, this.onArgumentRemoved);
        SCWeb.core.EventManager.subscribe("arguments/clear", this, this.onArgumentsCleared);
        
        
        // listen events from translation
        SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
            var items = self.getObjectsToTranslate();
            for (var i in items) {
                objects.push(items[i]);
            }
        });
        
        $('#arguments_clear_button').click(function() {
            if (self.isArgumentAddState()) return;
            SCWeb.core.Arguments.clear();
        });
        $('#arguments_add_button').click(function() {
            self.argument_add_state = !self.argument_add_state;
            self.updateArgumentAddState();
        });

        $(document).on("click", ".argument-item", function(event) {
            var idx = $(this).attr('arg_idx');
            SCWeb.core.Arguments.removeArgumentByIndex(parseInt(idx));
        });
        
        dfd.resolve();
        return dfd.promise();
    },

    isArgumentAddState: function() {
        return this.argument_add_state;
    },

    updateArgumentAddState: function() {
        var add_button = $("#arguments_add_button");
        if (this.argument_add_state) {
            add_button.addClass('argument-wait');
        } else {
            add_button.removeClass('argument-wait');
        }
    },

    // ------- Arguments listener interface -----------
    onArgumentAppended : function(argument, idx) {

        this.argument_add_state = false;
        this.updateArgumentAddState();

        var idx_str = idx.toString();
        var self = this;

        var new_button = '<button class="btn btn-primary argument-item argument-translate-state" sc_addr="'
                    + argument
                    + '" arg_idx="'
                    + idx_str
                    + '" id="argument_'
                    + idx_str
                    + '"></button>';
        $(this._container).append(new_button);

        // translate added argument
        $.when(SCWeb.core.Translation.translate([ argument ])).done(function(namesMap) {

            var value = argument;
            if (namesMap[argument]) {
                value = namesMap[argument];
            }

            $(self._container + " [sc_addr='" + argument + "']").text(value).removeClass('argument-translate-state');
        });

    },

    onArgumentRemoved : function(argument, idx) {

        $('#argument_' + idx.toString()).remove();
        // update indicies
        $(this._container + ' [arg_idx]').each(function(index, element) {

            var v = parseInt($(this).attr('arg_idx'));

            if (v > idx) {
                v = v - 1;
                $(this).attr('arg_idx', v.toString());
                $(this).attr('id', 'argument_' + v.toString());
            }
        });
    },

    onArgumentsCleared : function() {

        $(this._container).empty();
    },

    // ------- Translation listener interface ---------
    updateTranslation : function(namesMap) {

        // apply translation
        $('#arguments_buttons [sc_addr]').each(function(index, element) {

            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    },

    getObjectsToTranslate : function() {

        return SCWeb.core.Arguments._arguments;
    }

};


SCWeb.ui.TaskPanel = {
    _container: '#task_panel',
    _text_container: '#task_num',
    _task_num: 0,
    
    init: function(callback) {
        var dfd = new jQuery.Deferred();

        SCWeb.core.Server.appendListener(this);
        dfd.resolve();

        return dfd.promise();
    },
    
    /*!
     * Updates task panel view
     */
    updatePanel: function() {
        if (this._task_num == 0) {
            $(this._container).removeClass('active');
        }else{
            $(this._container).addClass('active');
        }
        var text = ''
        if (this._task_num > 0)
            text = this._task_num.toString();
        $(this._text_container).text(text);
    },
    
    // ------- Server listener --------
    taskStarted: function() {
        this._task_num++;
        this.updatePanel();
        SCWeb.ui.Locker.show();
    },
    
    taskFinished: function() {
        this._task_num--;
        this.updatePanel();
        SCWeb.ui.Locker.hide();
    }
};


SCWeb.ui.Menu = {
    _items: null,

    /*!
     * Initialize menu in user interface
     * @param {Object} params Parameters for menu initialization.
     * There are required parameters:
     * - menu_container_id - id of dom element that will contains menu items
     * - menu_commands - object, that represent menu command hierachy (in format returned from server)
     */
    init: function(params) {
        var dfd = new jQuery.Deferred();
        var self = this;
        
        this.menu_container_id = '#' + params.menu_container_id;
        
        // register for translation updates
        SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
            var items = self.getObjectsToTranslate();
            for (var i in items) {
                objects.push(items[i]);
            }
        });
        SCWeb.core.EventManager.subscribe("translation/update", this, function(names) {
            self.updateTranslation(names);
        });
        
        this._build(params.menu_commands);
        dfd.resolve();
        return dfd.promise();
    },

    _build: function(menuData) {

        this._items = [];

        var menuHtml = '<ul class="nav navbar-nav">';

        //TODO: change to children, remove intermediate 'childs'
        if(menuData.hasOwnProperty('childs')) {
            for(i in menuData.childs) {
                var subMenu = menuData.childs[i];
                menuHtml += this._parseMenuItem(subMenu);
            }
        }

        menuHtml += '</ul>';

        $(this.menu_container_id).append(menuHtml);

        this._registerMenuHandler();
    },

    _parseMenuItem: function(item) {

        this._items.push(item.id);

        var itemHtml = '';
        if (item.cmd_type == 'cmd_noatom') {
            itemHtml = '<li class="dropdown"><a sc_addr="' + item.id + '" id="' + item.id + '" class="menu-item menu-cmd-noatom dropdown-toggle" data-toggle="dropdown" href="#" ><span clas="text">' + item.id + '</span><b class="caret"></b></a>';
        } else if (item.cmd_type == 'cmd_atom') {
            itemHtml = '<li><a id="' + item.id + '"sc_addr="' + item.id + '" class="menu-item menu-cmd-atom" >' + item.id + '</a>';
        } else {
            itemHtml = '<li><a id="' + item.id + '"sc_addr="' + item.id + '" class="menu-item menu-cmd-keynode" >' + item.id + '</a>';
        }

        if (item.hasOwnProperty('childs')) {
            itemHtml += '<ul class="dropdown-menu">';
            for(i in item.childs) {
                var subMenu = item.childs[i];
                itemHtml += this._parseMenuItem(subMenu);
            }
            itemHtml += '</ul>';
        }
        return itemHtml + '</li>';
    },

    _registerMenuHandler: function() {
                
        $('.menu-item').click(function() {
            var sc_addr = $(this).attr('sc_addr');
            if ($(this).hasClass('menu-cmd-atom')) {
                SCWeb.core.Main.doCommand(sc_addr, SCWeb.core.Arguments._arguments);
            } else if ($(this).hasClass('menu-cmd-keynode')) {
                SCWeb.core.Main.doDefaultCommand([sc_addr]);
            }
        });
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $(this.menu_container_id + ' [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
        
    },
    
    /**
     * @return Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate: function() {
        return this._items;
    }
};


SCWeb.ui.Core = {
    
    init: function(data, callback) {
        var self = this;
        var dfd = new jQuery.Deferred();

        this.tooltip_interval = null;
        this.tooltip_element = null;

        function clearTooltipInterval() {
            if (self.tooltip_interval) {
                clearInterval(self.tooltip_interval);
                self.tooltip_interval = null;
            }
        }

        function destroyTooltip() {
            if (self.tooltip_element) {
                self.tooltip_element.tooltip('destroy');
                self.tooltip_element = null;
            }
        }

        $.when(SCWeb.ui.Menu.init(data),
               SCWeb.ui.ArgumentsPanel.init(),
               SCWeb.ui.UserPanel.init(data),
               SCWeb.ui.LanguagePanel.init(data),
               SCWeb.ui.WindowManager.init(data),
               SCWeb.ui.SearchPanel.init(),
               self.resolveElementsAddr('body')
            ).done(function() {

                // listen clicks on sc-elements
                var sc_elements_selector = '[sc_addr]:not(.sc-window)';
                $('#window-container,#help-modal').delegate(sc_elements_selector, 'click', function(e) {
                    if (!SCWeb.ui.ArgumentsPanel.isArgumentAddState() && !$(e.currentTarget).hasClass('sc-no-default-cmd')) {
                        SCWeb.core.Main.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
                        e.stopPropagation();
                    }
                });

                $('body')
                .delegate(sc_elements_selector, 'mouseover', function(e) {
                    self.sc_icon.removeClass('hidden');
                    setCursorIconPos(e.pageX, e.pageY);

                    clearTooltipInterval();
                    self.tooltip_element = $(this);
                    self.tooltip_interval = setInterval(function() {
                        clearInterval(self.tooltip_interval);
                        self.tooltip_interval = null;

                        var addr = self.tooltip_element.attr('sc_addr');
                        if (addr) {
                            SCWeb.core.Server.getTooltips([addr], function(tips) {
                                var value = tips[addr];
                                if (value) {
                                    self.tooltip_element.tooltip({
                                        html: true,
                                        placement: 'auto',
                                        trigger: 'manual',
                                        title: value,
                                        animation: true,
                                        container: 'body'
                                    }).tooltip('show');
                                } else
                                    destroyTooltip();
                            }, function() {
                                destroyTooltip();
                            });
                        }
                    }, 1000);
                })  
                .delegate(sc_elements_selector, 'mouseout', function(e) {
                    self.sc_icon.addClass('hidden');
                    setCursorIconPos(e.pageX, e.pageY);

                    clearTooltipInterval();
                    destroyTooltip();
                })
                .delegate(sc_elements_selector, 'mousemove', function(e) {
                    setCursorIconPos(e.pageX, e.pageY);
                }).delegate(sc_elements_selector, 'click', function(e) {
                    if (SCWeb.ui.ArgumentsPanel.isArgumentAddState()) {
                        SCWeb.core.Arguments.appendArgument($(this).attr('sc_addr'));
                        e.stopPropagation();
                    }
                });
                
                $('#help-modal').on('shown.bs.modal', function() {
                    var body = $('#help-modal-body');
                    if (body.hasClass('modal-empty')) {
                        body.addClass('loading');
                        // try to find content
                        SCWeb.core.Server.resolveScAddr(['ui_start_help'], function(addrs) {
                            var a = addrs['ui_start_help'];
                            if (a) {
                                body.html('<div id="help-modal-content" class="sc-window" sc_addr="' + a + '"> </div>');
                                $.when(SCWeb.ui.WindowManager.createViewersForScLinks({'help-modal-content': a}))
                                .done(function() {
                                    body.removeClass('loading');
                                    body.removeClass('modal-empty');
                                });
                            }
                        });
                    }
                });

                self.sc_icon = $(".sc-cursor-icon");
                // cursor icon for all sc-elements
                function setCursorIconPos(x, y) {
                    self.sc_icon.offset({
                        top: y + 10,
                        left: x + 10
                    });
                }
            
                dfd.resolve();
            });
        return dfd.promise();
    },
    
    /*! Returns selector to select all elements, that has sc_addr in specified window, excluding all 
     * sc_addr elements in child windows
     */
    selectorWindowScAddr: function(windowId) {
        return windowId + ' [sc_addr]:not(' + windowId + ' .sc-content [sc_addr])';
    },

    /*! Resolve sc-addrs for elements, that has sc_control_sys_idtf attribute in specified container
     * @param {String} parentSelector String that contains selector for parent element
     */
    resolveElementsAddr: function(parentSelector) {
        var dfd = new jQuery.Deferred();

        var attr_name = 'sc_control_sys_idtf';
        var identifiers = [];
        var elements = [];
        $(parentSelector + ' [' + attr_name + ']').each(function() {
            identifiers.push($(this).attr(attr_name));
            elements.push($(this));
        });

        SCWeb.core.Server.resolveScAddr(identifiers, function(addrs) {
            for (e in elements) {
                var el = elements[e];
                var addr = addrs[el.attr(attr_name)];
                if (addr) {
                    el.attr('sc_addr', addr);
                } else {
                    el.addClass('sc-not-exist-control');
                }
            }
            dfd.resolve();
        });

        return dfd.promise();
    }
};


SCWeb.ui.LanguagePanel = {
    
    /*!
     * Initialize settings panel.
     * @param {Object} params Parameters for panel initialization.
     * There are required parameters:
     * - languages - list of available natural languages
     */
    init: function(params) {
        var dfd = new jQuery.Deferred();
        this.languages = params.languages;
        
        var html = '';
        for (i in this.languages) {
            var addr = this.languages[i];
            
            html += '<option sc_addr="' + addr + '">' + addr + '</option>';
        }
        
        // append languages to select
        $('#language-select').html(html)
            .val(params.user.current_lang)
            .change(function() {
                SCWeb.ui.Locker.show();
                var addr = $('#language-select option:selected').attr("sc_addr");
                $('#language-select').attr('disabled', true);
                SCWeb.core.Translation.setLanguage(addr, function() {
                    $('#language-select').removeAttr('disabled', true);
                    SCWeb.ui.Locker.hide();
                });
            });
        
        // listen translation events
        SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
            $('#language-select [sc_addr]').each(function(index, element) {
                objects.push($(element).attr('sc_addr'));
            });
        });
        
        dfd.resolve();
        return dfd.promise();
    },
    
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#language-select [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr].replace('user::', '').replace('session::', ''));
            }
        });
        
    },
    
};


function AppCache(opt) {
    this.opt = opt;
    this.cache = [];
}

/*
 * delete all expire keys or if key exist
 * return true if one or more keys have been removed
 */
AppCache.prototype._delExpire = function (key) {
    var rm = false,
        cache = this.cache,
        l = cache.length,
        now = Date.now(),
        obj;

    while (l--) {
        obj = cache[l];

        if (now > obj.expire || key === obj.key) {
            cache.splice(l, 1);
            rm = true;
        }
    }

    return rm;
};

AppCache.prototype.get = function (key) {
    var data,
        now = Date.now(),
        cache = this.cache,
        l = cache.length,
        obj;

    while (l--) {
        obj = cache[l];

        if (obj.key === key) {
            data = obj;
            break;
        }
    }

    if (data && now > data.expire) {
        cache.splice(l, 1);
        data = null;
    }

    return (data ? data.val : null);
};

AppCache.prototype.set = function (key, val) {
    var cache = this.cache,
        max = this.opt.max,
        data = {
            key: key,
            expire: Date.now() + this.opt.expire,
            val: val
        },
        l = cache.length;

    if (l < max) {
        cache.push(data);
    } else if (l >= max && this._delExpire(key)) {
        cache.push(data);
    } else if (l >= max) {
        cache.shift();
        cache.push(data);
    }
};

AppCache.prototype.clear = function() {
    this.cache = [];
};



var SctpCommandType = {
    SCTP_CMD_UNKNOWN:           0x00, // unkown command
    SCTP_CMD_CHECK_ELEMENT:     0x01, // check if specified sc-element exist
    SCTP_CMD_GET_ELEMENT_TYPE:  0x02, // return sc-element type
    SCTP_CMD_ERASE_ELEMENT:     0x03, // erase specified sc-element
    SCTP_CMD_CREATE_NODE:       0x04, // create new sc-node
    SCTP_CMD_CREATE_LINK:       0x05, // create new sc-link
    SCTP_CMD_CREATE_ARC:        0x06, // create new sc-arc
    SCTP_CMD_GET_ARC:           0x07, // return begin element of sc-arc

    SCTP_CMD_GET_LINK_CONTENT:  0x09, // return content of sc-link
    SCTP_CMD_FIND_LINKS:        0x0a, // return sc-links with specified content
    SCTP_CMD_SET_LINK_CONTENT:  0x0b, // setup new content for the link
    SCTP_CMD_ITERATE_ELEMENTS:  0x0c, // return base template iteration result
    
    SCTP_CMD_EVENT_CREATE:      0x0e, // create subscription to specified event
    SCTP_CMD_EVENT_DESTROY:     0x0f, // destroys specified event subscription
    SCTP_CMD_EVENT_EMIT:        0x10, // emits events to client

    SCTP_CMD_FIND_ELEMENT_BY_SYSITDF:   0xa0, // return sc-element by it system identifier
    SCTP_CMD_SET_SYSIDTF:       0xa1, // setup new system identifier for sc-element
    SCTP_CMD_STATISTICS:        0xa2, // return usage statistics from server

    SCTP_CMD_SHUTDOWN:          0xfe // disconnect client from server
};


var SctpResultCode = {
    SCTP_RESULT_OK:                 0x00, 
    SCTP_RESULT_FAIL:               0x01, 
    SCTP_RESULT_ERROR_NO_ELEMENT:   0x02 // sc-element wasn't founded
}


var SctpIteratorType = {
    SCTP_ITERATOR_3F_A_A:       0,
    SCTP_ITERATOR_3A_A_F:       1,
    SCTP_ITERATOR_3F_A_F:       2,
    SCTP_ITERATOR_5F_A_A_A_F:   3,
    SCTP_ITERATOR_5_A_A_F_A_F:  4,
    SCTP_ITERATOR_5_F_A_F_A_F:  5,
    SCTP_ITERATOR_5_F_A_F_A_A:  6,
    SCTP_ITERATOR_5_F_A_A_A_A:  7,
    SCTP_ITERATOR_5_A_A_F_A_A:  8
}

var SctpEventType = {
    SC_EVENT_UNKNOWN:           -1,
    SC_EVENT_ADD_OUTPUT_ARC:     0,
    SC_EVENT_ADD_INPUT_ARC:      1,
    SC_EVENT_REMOVE_OUTPUT_ARC:  2,
    SC_EVENT_REMOVE_INPUT_ARC:   3,
    SC_EVENT_REMOVE_ELEMENT:     4
}

sc_addr_from_id = function(sc_id) {
    var a = sc_id.split("_");
    var seg = parseInt(a[0]);
    var offset = parseInt(a[1]);
    
    return (seg << 16) | offset;
}

SctpClient = function() {
    this.socket = null;
    this.task_queue = [];
    this.task_timeout = 0;
    this.task_frequency = 10;
    this.events = {};
}

SctpClient.prototype.connect = function(url, success) {
    this.socket = new SockJS(url);

    var self = this;
    this.socket.onopen = function() {
        success();
        console.log('open');
        
        var emit_events = function() {
            if (self.event_timeout != 0)
            {
                window.clearTimeout(self.event_timeout);
                self.event_timeout = 0;
            }
            
            self.event_emit();
            
            window.setTimeout(emit_events, 5000);
        };
        
        emit_events();
    };
    this.socket.onmessage = function(e) {
        console.log('message', e.data);
    };
    this.socket.onclose = function() {
        console.log('close');
    };
    
}


SctpClient.prototype._push_task = function(task) {
    this.task_queue.push(task);
    var self = this;
    
    function process() {
        var t = self.task_queue.shift();
        self.socket.onmessage = function(e) {
            var str = e.data;
            var obj = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                        str.replace(/"(\\.|[^"\\])*"/g, ''))) &&
                        eval('(' + str + ')');
            
            if (obj.resCode == SctpResultCode.SCTP_RESULT_OK) {
                t.dfd.resolve(obj);
            } else
                t.dfd.reject(obj);
            
            if (self.task_queue.length > 0)
                self.task_timeout = window.setTimeout(process, this.task_frequency)
            else
            {
                window.clearTimeout(self.task_timeout);
                self.task_timeout = 0;
            }
        }

        self.socket.send(t.message);
            
    }
    
    if (!this.task_timeout) {
        this.task_timeout = window.setTimeout(process, this.task_frequency)
    }
};

SctpClient.prototype.new_request = function(message) {
    var dfd = new jQuery.Deferred();
    this._push_task({
        message: JSON.stringify(message),
        dfd: dfd
    });
    return dfd.promise();
};

SctpClient.prototype.erase_element = function(addr) {
    throw "Not supported";
};


SctpClient.prototype.check_element = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_CHECK_ELEMENT, 
        args: [addr]
    });
};


SctpClient.prototype.get_element_type = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE,
        args: [addr]
    });
};

SctpClient.prototype.get_arc = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_GET_ARC,
        args: [addr]
    });
};

SctpClient.prototype.create_node = function(type) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_CREATE_NODE,
        args: [type]
    });
};


SctpClient.prototype.create_arc = function(type, src, trg) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_CREATE_ARC,
        args: [type, src, trg]
    });
};


SctpClient.prototype.create_link = function() {
    throw "Not supported";
};


SctpClient.prototype.set_link_content = function(addr, data) {
    throw "Not supported";
};


SctpClient.prototype.get_link_content = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_GET_LINK_CONTENT,
        args: [addr]
    });
};


SctpClient.prototype.find_links_with_content = function(data) {
    throw "Not implemented";
};


SctpClient.prototype.iterate_elements = function(iterator_type, args) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_ITERATE_ELEMENTS,
        args: [iterator_type].concat(args)
    });
};


SctpClient.prototype.find_element_by_system_identifier = function(data) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF, 
        args: [data]
    });
};


SctpClient.prototype.set_system_identifier = function(addr, idtf) {
    throw "Not supported";
};

SctpClient.prototype.event_create = function(evt_type, addr, callback) {
    var dfd = new jQuery.Deferred();
    var self = this;
    this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_EVENT_CREATE,
        args: [evt_type, addr]
    }).done(function(data) {
        self.events[data.result] = callback;
        dfd.resolve(data);
    }).fail(function(data) {
        dfd.reject(data);
    });
    
    return dfd.promise();
};

SctpClient.prototype.event_destroy = function(evt_id) {
    var dfd = new jQuery.Deferred();
    var self = this;
    
    this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_EVENT_DESTROY,
        args: [evt_id]
    }).done(function(data) {
        delete self.event_emit[evt_id];
        dfd.promise(data.result);
    }).fail(function(data){ 
        dfd.reject(data);
    });
    
    return dfd.promise();
};

SctpClient.prototype.event_emit = function() {
    var dfd = new jQuery.Deferred();
    var self = this;
    this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_EVENT_EMIT
    }).done(function (data) {
        
        for (e in data.result) {
            var evt = data.result[e];
            
            evt_id = evt[0];
            addr = evt[1];
            arg = evt[2];
            var func = self.events[evt_id];
            
            if (func)
                func(addr, arg);
        }
    }).fail(function(data) {
        dfd.reject();
    });
    return dfd.promise();
};

SctpClient.prototype.get_statistics = function() {
    throw "Not implemented";
};

SctpClientCreate = function() {
    var dfd = jQuery.Deferred();
    
    var sctp_client = new SctpClient();
    sctp_client.connect('/sctp', function() {
        dfd.resolve(sctp_client);
    });
    
    return dfd.promise();
};

/* Object to read/write bynary data
 */
BinaryData = function(size, data) {
    
};

BinaryData.prototype.calcSize = function() {
};

/*!
 * Unpack data types from string, with specified format
 * @param {str} fmt String that contains data format
 * @param {ArrayBuffer} data Array buffer, that contains binary data for unpacking
 *
 * @returns Returns array, that contains unpacked data
 */
BinaryData.prototype.unpack = function(fmt, data) {
};

/*! Pack data to binary array buffer
 * @param 
 */
BinaryData.prototype.pack = function(fmt, args) {
};

TripleUtils = function() {
    this.outputEdges = {};
    this.inputEdges = {};
    this.types = {};
};

TripleUtils.prototype = {

    appendTriple: function(tpl) {
        this.types[tpl[0].addr] = tpl[0].type;
        this.types[tpl[1].addr] = tpl[1].type;
        this.types[tpl[2].addr] = tpl[2].type;

        this._appendOutputEdge(tpl[0].addr, tpl[1].addr, tpl[2].addr);
        this._appendInputEdge(tpl[0].addr, tpl[1].addr, tpl[2].addr);
    },

    removeTriple: function(tpl) {
        this._removeOutputEdge(tpl[0].addr, tpl[1].addr);
        this._removeInputEdge(tpl[2].addr, tpl[1].addr);
    },

    /*! Search all constructions, that equal to template. 
     * @returns If something found, then returns list of results; otherwise returns null
     */
    find5_f_a_a_a_f: function(addr1, type2, type3, type4, addr5) {
        var res = null;
        // iterate all output edges from addr1
        var list = this.outputEdges[addr1];
        if (!list) return null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && this._compareType(type3, this._getType(edge.trg))) {
                // second triple iteration
                var list2 = this.inputEdges[edge.edge];
                if (list2) {
                    for (l2 in list2) {
                        var edge2 = list2[l2];
                        if (this._compareType(type4, this._getType(edge2.edge)) && (edge2.src == addr5)) {
                            if (!res) res = [];
                            res.push([
                                { addr: addr1, type: this._getType(addr1) },
                                { addr: edge.edge, type: this._getType(edge.edge) },
                                { addr: edge.trg, type: this._getType(edge.trg) },
                                { addr: edge2.edge, type: this._getType(edge2.edge) },
                                { addr: addr5, type: this._getType(addr5) }
                            ]);
                        }
                    }
                }
            }
        }
        return res;
    },

    find5_f_a_f_a_f: function(addr1, type2, addr3, type4, addr5) {
        var list = this.inputEdges[addr3];
        if (!list) return null;

        var res = null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && (addr1 === edge.src)) {
                var list2 = this.inputEdges[addr5];
                if (!list2) continue;

                for (l2 in list2) {
                    var edge2 = list2[l2];
                    if (this._compareType(type4, this._getType(edge2.edge)) && (addr3 === edge.src)) {
                        if (!res) res = [];
                        res.push([
                            { addr: addr1, type: this._getType(addr1) },
                            { addr: edge.edge, type: this._getType(edge.edge) },
                            { addr: addr3, type: this._getType(addr3) },
                            { addr: edge2.edge, type: this._getType(edge2.edge) },
                            { addr: addr5, type: this._getType(addr5) }
                        ]);
                    }
                }
            }
        }
    },

    find3_f_a_f: function(addr1, type2, addr3) {
        var list = this.inputEdges[addr3];
        if (!list) return null;

        var res = null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, edge.edge) && (addr1 === edge.src)) {
                if (!res) res = [];
                res.push([
                    { addr: addr1, type: this._getType(addr1) },
                    { addr: edge.edge, type: this._getType(edge.edge) },
                    { addr: addr3, type: this._getType(addr3) }
                ]);
            }
        }

        return res;
    },

    /*! Search all constructions, that equal to template. 
     * @returns If something found, then returns list of results; otherwise returns null
     */
    find3_f_a_a: function(addr1, type2, type3) {
        // iterate elements
        var list = this.outputEdges[addr1];
        if (!list) return null;

        var res = null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && this._compareType(type3, this._getType(edge.trg))) {
                if (!res) res = [];
                res.push([
                    { addr: addr1, type: this._getType(addr1) },
                    { addr: edge.edge, type: this._getType(edge.edge) },
                    { addr: edge.trg, type: this._getType(edge.trg) }
                ]);
            }
        }
        return res;
    },

    checkAnyOutputEdge: function(srcAddr) {
        return this.outputEdges[srcAddr] ? true : false;
    },

    checkAnyInputEdge: function(trgAddr) {
        return this.inputEdges[trgAddr] ? true : false;
    },

    checkAnyOutputEdgeType: function(srcAddr, edgeType) {
        var list = this.outputEdges[srcAddr];
        if (list) {
            for (l in list) {
                if (this._checkType(edgeType, this._getType(list[l].edge)))
                    return true;
            }
        }
        return false;
    },

    checkAnyInputEdgeType: function(trgAddr, edgeType) {
        var list = this.inputEdges[trgAddr];
        if (list) {
            for (l in list) {
                if (this._checkType(edgeType, this._getType(list[l].edge)))
                    return true;
            }
        }
        return false;
    },

    // just for internal usage
    _compareType: function(it_type, el_type) {
        return ((it_type & el_type) == it_type);
    },
    
    _getType: function(addr) {
        return this.types[addr];
    },

    _appendOutputEdge: function(srcAddr, edgeAddr, trgAddr) {
        var list = this.outputEdges[srcAddr];
        var edge = {src: srcAddr, edge: edgeAddr, trg: trgAddr};
        if (!list) {
            this.outputEdges[srcAddr] = [edge];
        } else {
            list.push(edge);
        }
    },

    _removeOutputEdge: function(srcAddr, edgeAddr) {
        var list = this.outputEdges[srcAddr];
        if (list) {
            for (e in list) {
                var edge = list[e];
                if (edge.edge == edgeAddr) {
                    this.outputEdges.splice(e, 1);
                    return;
                }
            }
        }
        
        throw "Can't find output edges"
    },

    _appendInputEdge: function(srcAddr, edgeAddr, trgAddr) {
        var list = this.inputEdges[trgAddr];
        var edge = {src: srcAddr, edge: edgeAddr, trg: trgAddr};
        if (!list) {
            this.inputEdges[trgAddr] = [edge];
        } else {
            list.push(edge);
        }
    },
    
    _removeInputEdge: function(trgAddr, edgeAddr) {
        var list = this.inputEdges[trgAddr];
        if (list) {
            for (e in list) {
                var edge = list[e];
                if (edge.edge == edgeAddr) {
                    this.inputEdges.splice(e, 1);
                    return;
                }
            }
        }
        
        throw "Can't find input edges"
    }

};



ScKeynodes = function(helper) {
    this.helper = helper;
    this.sctp_client = helper.sctp_client;
};

ScKeynodes.prototype.init = function() {
    var dfd = new jQuery.Deferred();
    var self = this;
    
    $.when(
        this.resolveKeynode('nrel_system_identifier'),
        this.resolveKeynode('nrel_main_idtf'),
        this.resolveKeynode('nrel_idtf'),
        this.resolveKeynode('nrel_answer'),
        
        this.resolveKeynode('ui_user'),
        this.resolveKeynode('ui_user_registered'),
        this.resolveKeynode('ui_main_menu'),
        this.resolveKeynode('ui_user_command_class_atom'),
        this.resolveKeynode('ui_user_command_class_noatom'),
        this.resolveKeynode('ui_external_languages'),
        this.resolveKeynode('ui_rrel_command_arguments'),
        this.resolveKeynode('ui_rrel_command'),
        this.resolveKeynode('ui_nrel_command_result'),
        this.resolveKeynode('ui_nrel_user_answer_formats'),
        
        this.resolveKeynode('nrel_ui_commands_decomposition'),
        
        this.resolveKeynode('ui_command_initiated'),
        this.resolveKeynode('ui_command_finished'),
        this.resolveKeynode('ui_nrel_user_used_language'),
        this.resolveKeynode('ui_nrel_user_default_ext_language'),
        
        
        this.resolveKeynode('languages')
        
    ).done(function() {
        dfd.resolve();
    });
    
    return dfd.promise();
};

ScKeynodes.prototype.resolveKeynode = function(sys_idtf, property) {
    var dfd = new jQuery.Deferred();
    var self = this;
    
    this.sctp_client.find_element_by_system_identifier(sys_idtf).done(function(res) {
      
        if (res.resCode != SctpResultCode.SCTP_RESULT_OK) {
            throw "Can't resolve keynode " + sys_idtf;
            dfd.reject();
        }
        
        if (property) {
            self[property] = res.result;
        } else {
            self[sys_idtf] = res.result;
        }
        
        dfd.resolve(res.result);
    });
    
    return dfd.promise();
};


    function parseURL(url) {
        var parser = document.createElement('a'),
            searchObject = {},
            queries, split, i;
        // Let the browser do the work
        parser.href = url;
        // Convert query string to object
        queries = parser.search.replace(/^\?/, '').split('&');
        for( i = 0; i < queries.length; i++ ) {
            split = queries[i].split('=');
            searchObject[split[0]] = split[1];
        }
        return {
            protocol: parser.protocol,
            host: parser.host,
            hostname: parser.hostname,
            port: parser.port,
            pathname: parser.pathname,
            search: parser.search,
            searchObject: searchObject,
            hash: parser.hash
        };
    }

ScHelper = function(sctp_client) {
    this.sctp_client = sctp_client;
};

ScHelper.prototype.init = function() {
    var dfd = new jQuery.Deferred();

    dfd.resolve();
    
    return dfd.promise();
};

/*! Check if there are specified arc between two objects
 * @param {String} addr1 sc-addr of source sc-element
 * @param {int} type type of sc-edge, that need to be checked for existing
 * @param {String} addr2 sc-addr of target sc-element
 * @returns Function returns Promise object. If sc-edge exists, then it would be resolved; 
 * otherwise it would be rejected
 */
ScHelper.prototype.checkEdge = function(addr1, type, addr2 ) {
    var dfd = new jQuery.Deferred();
    
    this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F, 
                                      [
                                          addr1,
                                          type,
                                          addr2
                                      ]).done(function() {
        dfd.resolve();
    }).fail(function() {
        dfd.reject();
    });
    
    return dfd.promise();
};

/*! Function to get elements of specified set
 * @param addr {String} sc-addr of set to get elements
 * @returns Returns promise objects, that resolved with a list of set elements. If 
 * failed, that promise object rejects
 */
ScHelper.prototype.getSetElements = function(addr) {
    var dfd = new jQuery.Deferred();
    
    this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                      [
                                          addr,
                                          sc_type_arc_pos_const_perm,
                                          sc_type_node | sc_type_const
                                      ])
    .done(function (res) {
        var langs = [];
        
        for (r in res.result) {
            langs.push(res.result[r][2]);
        }
        
        dfd.resolve(langs);
        
    }).fail(function () {
        dfd.reject();
    });
    
    return dfd.promise();
};

/*! Function resolve commands hierarchy for main menu.
 * It returns main menu command object, that contains whole hierarchy as a child objects
 */
ScHelper.prototype.getMainMenuCommands = function() {
    
    var self = this;
    
    function determineType(cmd_addr) {
        var dfd = new jQuery.Deferred();
        window.scHelper.checkEdge(
            window.scKeynodes.ui_user_command_class_atom,
            sc_type_arc_pos_const_perm,
            cmd_addr)
        .done(function() {
            dfd.resolve('cmd_atom');    
        })
        .fail(function() {
            window.scHelper.checkEdge(
                window.scKeynodes.ui_user_command_class_noatom,
                sc_type_arc_pos_const_perm,
                cmd_addr)
            .done(function() {
                dfd.resolve('cmd_noatom');
            })
            .fail(function() {
                dfd.resolve('unknown');
            });
        });
        
        return dfd.promise();
    }
    
    function parseCommand(cmd_addr, parent_cmd) {
        var dfd = new jQuery.Deferred();
        
        // determine command type
        determineType(cmd_addr)
            .done(function(type) {
                var res = {};
                res['cmd_type'] = type;
                res['id'] = cmd_addr;
                
                if (parent_cmd) {
                    if (!parent_cmd.hasOwnProperty('childs'))
                        parent_cmd['childs'] = [];

                    parent_cmd.childs.push(res);
                }
                
                // try to find decomposition
                self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                                  [
                                                      sc_type_node | sc_type_const,
                                                      sc_type_arc_common | sc_type_const,
                                                      cmd_addr,
                                                      sc_type_arc_pos_const_perm,
                                                      window.scKeynodes.nrel_ui_commands_decomposition
                                                  ])
                .done(function(it1) {
                    // iterate child commands
                    self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                                      [
                                                          it1.result[0][0],
                                                          sc_type_arc_pos_const_perm,
                                                          0
                                                      ])
                    .done(function(it2) {
                        var childsDef = [];
                        for (idx in it2.result) {
                            childsDef.push(parseCommand(it2.result[idx][2], res));
                        }
                        
                        $.when.apply($, childsDef)
                            .done(function() {
                                dfd.resolve(res);
                            });
                    })
                    .fail(function() {
                        dfd.resolve(res);
                    });
                })
                .fail(function() {
                    dfd.resolve(res);
                });
                
            });
        
        return dfd.promise();
    }
    
    
    return parseCommand(window.scKeynodes.ui_main_menu, null);
};

/*! Function to get available native user languages
 * @returns Returns promise object. It will be resolved with one argument - list of 
 * available user native languages. If funtion failed, then promise object rejects.
 */
ScHelper.prototype.getLanguages = function() {
    return scHelper.getSetElements(window.scKeynodes.languages);
};

/*! Function to get list of available output languages
 * @returns Returns promise objects, that resolved with a list of available output languages. If 
 * failed, then promise rejects
 */
ScHelper.prototype.getOutputLanguages = function() {
    return scHelper.getSetElements(window.scKeynodes.ui_external_languages);
};

/*! Function to find answer for a specified question
 * @param question_addr sc-addr of question to get answer
 * @returns Returns promise object, that resolves with sc-addr of found answer structure.
 * If function fails, then promise rejects
 */
ScHelper.prototype.getAnswer = function(question_addr) {
    var dfd = new jQuery.Deferred();
    
    (function(_question_addr, _self, _dfd) {
        var fn = this;
        
        this.timer = window.setTimeout(function() {
            _dfd.reject();
            
            window.clearTimeout(fn.timer);
            delete fn.timer;
            
            if (fn.event_id) {
                _self.sctp_client.event_destroy(fn.event_id);
                delete fn.event_id;
            }
        }, 10000);
        
        _self.sctp_client.event_create(SctpEventType.SC_EVENT_ADD_OUTPUT_ARC, _question_addr, function(addr, arg) {
            _self.checkEdge(window.scKeynodes.nrel_answer, sc_type_arc_pos_const_perm, arg).done(function() {
                _self.sctp_client.get_arc_end(arg).done(function(res) {
                    _dfd.resolve(res.result);
                }).fail(function() {
                    _dfd.reject();
                });
            });
        }).done(function(res) {
            fn.event_id = res.result;
            _self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                              [
                                                  _question_addr,
                                                  sc_type_arc_common | sc_type_const,
                                                  sc_type_node, /// @todo possible need node struct
                                                  sc_type_arc_pos_const_perm,
                                                  window.scKeynodes.nrel_answer
                                              ])
            .done(function(it) {
                _self.sctp_client.event_destroy(fn.event_id).fail(function() {
                    /// @todo process fail
                });
                _dfd.resolve(it.result[0][2]);
                
                window.clearTimeout(fn.timer);
            });
        });
    })(question_addr, this, dfd);
    
    
    
    return dfd.promise();
};

/*! Function to get system identifier
 * @param addr sc-addr of element to get system identifier
 * @returns Returns promise object, that resolves with found system identifier.
 * If there are no system identifier, then promise rejects
 */
ScHelper.prototype.getSystemIdentifier = function(addr) {
    var dfd = new jQuery.Deferred();
    
    var self = this;
    this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                      [
                                       addr,
                                       sc_type_arc_common | sc_type_const,
                                       sc_type_link,
                                       sc_type_arc_pos_const_perm,
                                       window.scKeynodes.nrel_system_identifier
                                      ])
    .done(function (it) {
        self.sctp_client.get_link_content(it.result[0][2])
        .done(function(res) {
            dfd.resolve(res.result);
        })
        .fail(function() {
            dfd.reject();
        });
    })
    .fail(function() { 
        dfd.reject()
    });
    
    return dfd.promise();
};

/*! Function to get element identifer
 * @param addr sc-addr of element to get identifier
 * @param lang sc-addr of language
 * @returns Returns promise object, that resolves with found identifier. 
 * If there are no any identifier, then promise rejects
 */
ScHelper.prototype.getIdentifier = function(addr, lang) {
    var dfd = new jQuery.Deferred();
    var self = this;
    
    var get_sys = function() {
        self.getSystemIdentifier(addr)
            .done(function (res) {
                dfd.resolve(res);
            })
            .fail(function() {
                dfd.reject();
            });
    };
    

    (function(addr, lang, self, dfd) {
        self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                          [
                                           addr,
                                           sc_type_arc_common | sc_type_const,
                                           sc_type_link,
                                           sc_type_arc_pos_const_perm,
                                           window.scKeynodes.nrel_main_idtf
                                          ])
        .done(function (it) {
            var process_result = function() {
                if (it.result.length == 0) {
                    get_sys();
                } else {
                    var r = it.result.shift();

                    self.checkEdge(lang, sc_type_arc_pos_const_perm, r[2])
                        .done(function() {
                            self.sctp_client.get_link_content(r[2])
                                .done(function(res) {
                                    dfd.resolve(res.result);
                                })
                                .fail(function() {
                                    dfd.reject();
                                });
                        }).fail(function() {
                            process_result();
                        });
                }
            }
            
            process_result();
        })
        .fail(function() {
            get_sys();
        });
    })(addr, lang, this, dfd);
    
    return dfd.promise();
};

function fQueueFunc() {
    return {
        func: arguments[0],
        done: arguments[1],
        args: arguments.slice(2)
    };
}

function fQueue() {
    var dfd = new jQuery.Deferred();
    var funcs = arguments.slice(0);
    
    (function next() {
        if(funcs.length > 0) {
            var f = funcs.shift();
            f.func.call(f.args)
                .done(function() {
                    if (f.done)
                        f.done.call(arguments);
                    next();
                })
                .fail(function() {
                    dfd.reject.call(arguments);
                });
        }
    })();
    
    return dfd.promise();
};

(function dfdQueue() {
    
    var q,
        tasks = [],
        remain = 0,
        await = null;   // callback
    
    var pushImpl = function(dfd) {
        remain++;
        dfd.done()
    };
        
    return q = {
        push: function(dfd) {
            pushImpl(dfd);
        },
        
        awaitAll: function(f) {
            await = f;
        }
    };
    
})();

