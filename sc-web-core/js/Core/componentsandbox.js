SCWeb.core.scAddrsDict = {};

/**
 * Create new instance of component sandbox.
 * @param {String} container Id of dom object, that will contain component
 * @param {String} link_addr sc-addr of link, that edit or viewed with sandbox
 * @param {Object} keynodes Dictionary that contains keynode addr by system identifiers
 */
SCWeb.core.ComponentSandbox = function(container, link_addr, keynodes) {
    this.container = container;
    this.link_addr = link_addr;
    
    this.eventGetObjectsToTranslate = null;
    this.eventApplyTranslation = null;
    this.eventArgumentsUpdate = null;
    this.eventWindowActiveChanged = null;
    this.eventDataAppend = null;
    
    this.listeners = [];
    this.keynodes = keynodes;
    
    var self = this;
    this.listeners = [];
    
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
};


// ------------------ Functions to call from component --------
/*!
 * @param {Array} args Array of sc-addrs of commnad arguments.
 */
SCWeb.core.ComponentSandbox.prototype.doDefaultCommand = function(args) {
    SCWeb.core.Main.doDefaultCommand(args);
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
    var dfd = new jQuery.Deferred();

    var linkAddrs = [];
    for (var cntId in containers_map)
            linkAddrs.push(containers_map[cntId]);

    if (linkAddrs.length == 0) {
        dfd.resolve();
        return dfd.promise();
    }
                
    SCWeb.core.Server.getLinksFormat(linkAddrs,
        function(formats) {
            
            var result = {};
            var promises = [];
            var defferers = {};

            for (var cntId in containers_map) {
                var addr = containers_map[cntId];
                var fmt = formats[addr];
                if (fmt) {
                    var d = new jQuery.Deferred();
                    defferers[addr] = d;
                    promises.push(d.promise());

                    $.when(SCWeb.core.ComponentManager.createWindowSandbox(fmt, addr, cntId)).then(
                                    function(sandbox) {
                                        if (sandbox) {
                                            result[addr] = sandbox;
                                            defferers[sandbox.link_addr].resolve();
                                        }
                                    },
                                    function() {
                                        d.reject();
                                    });
                }
            }
            
            $.when.apply($, promises).then(
                    function () {
                        dfd.resolve();
                    },
                    function() {
                        dfd.reject();
                    });
        },
        function() {
            dfd.reject();
        }
    );
    
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
