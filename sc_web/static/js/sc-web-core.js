$.namespace('SCWeb.core');

SCWeb.core.Arguments = {

    _listeners : [],
    _arguments : [],

    /**
     * Append new argument into the end of list
     * 
     * @param {String}
     *            argument SC-addr of command argument
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
     *            argument SC-add of argument to remove
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
     *            idx Index of argument to remove
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
     * @param {Object}
     *            listener Listener object, that will recieve notifitacions on
     *            arguments list changes. It must have such functions as: -
     *            argumentAppended(argument, idx) - argumentRemoved(argument,
     *            idx) - argumentsCleared(arguments)
     */
    registerListener : function(listener) {

        if (this._listeners.indexOf(listener) == -1) {
            this._listeners.push(listener);
        }
    },

    /**
     * @param {Object}
     *            listener Listener objects that need to be unregistered
     */
    unregisterListener : function(listener) {

        var idx = this._listeners.indexOf(listener);
        if (idx >= 0) {
            this._listeners.splice(idx, 1);
        }
    },

    /**
     * Notify listener on argument added
     * 
     * @param {String}
     *            argument Argument, that was added *
     * @param {Number}
     *            Index of added argument
     */
    _fireArgumentAppended : function(argument, idx) {

        for ( var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].argumentAppended(argument, idx);
        }
    },

    /**
     * Notify listener on argument removed
     * 
     * @param {String}
     *            argument Argument, that was removed
     * @param {Number}
     *            Index of removed argument
     */
    _fireArgumentRemoved : function(argument, idx) {

        for ( var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].argumentRemoved(argument, idx);
        }
    },

    /**
     * Notify listener on argument clear
     */
    _fireArgumentCleared : function() {

        for ( var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].argumentsCleared();
        }
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
    _callback: null,
    _componentCount: 0,
    
    init: function(callback) {
        // callback will be invoked when all component will be registered
        this._callback = callback;
        this._componentCount = this._initialize_funcs.length;

        for (var i = 0; i < this._initialize_funcs.length; i++) {
            this._initialize_funcs[i]();
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
     * container - id of dom container to append component
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

            // one more component was completely registered
            self._componentCount--;
            // all components were registered, invoke main callback
            if(self._componentCount === 0) {
                self._callback();
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
     * Each editor and view components must have such functions as:
     * - receiveData - function, that receive json data to show
     * - translateIdentifiers - function, that notify window, that it need to translate identifiers
     * - getIdentifiersLanguage - function, that return sc-addr of used identifier language
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


// sc-element types
var sc_type_node            = 0x1
var sc_type_link            = 0x2
var sc_type_edge_common     = 0x4
var sc_type_arc_common      = 0x8
var sc_type_arc_access      = 0x10

// sc-element constant
var sc_type_const           = 0x20
var sc_type_var             = 0x40

// sc-element positivity
var sc_type_arc_pos         = 0x80
var sc_type_arc_neg         = 0x100
var sc_type_arc_fuz         = 0x200

// sc-element premanently
var sc_type_arc_temp        = 0x400
var sc_type_arc_perm        = 0x800

// struct node types
var sc_type_node_tuple          = (0x80)
var sc_type_node_struct         = (0x100)
var sc_type_node_role           = (0x200)
var sc_type_node_norole         = (0x400)
var sc_type_node_class          = (0x800)
var sc_type_node_abstract       = (0x1000)
var sc_type_node_material       = (0x2000)

var sc_type_arc_pos_const_perm  = (sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm)

// type mask
var sc_type_element_mask        = (sc_type_node | sc_type_link | sc_type_edge_common | sc_type_arc_common | sc_type_arc_access)
var sc_type_constancy_mask      = (sc_type_const | sc_type_var)
var sc_type_positivity_mask     = (sc_type_arc_pos | sc_type_arc_neg | sc_type_arc_fuz)
var sc_type_permanency_mask     = (sc_type_arc_perm | sc_type_arc_temp)
var sc_type_node_struct_mask    = (sc_type_node_tuple | sc_type_node_struct | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material)
var sc_type_arc_mask            = (sc_type_arc_access | sc_type_arc_common | sc_type_edge_common)


SCWeb.core.Main = {
    init: function(callback) {
        var self = this;
        SCWeb.core.utils.Keyboard.init(function() {
            self._initUI(callback);
        });
    },

    _initUI: function(callback) {
        SCWeb.core.ui.TaskPanel.init(function() {
            SCWeb.core.ui.Menu.init(function() {           
                SCWeb.core.ui.OutputLanguages.init(function() {
                    SCWeb.core.ComponentManager.init(function() {
                        SCWeb.core.ui.ArgumentsPanel.init(function() {
                            SCWeb.core.ui.Windows.init(function() {
                                SCWeb.core.ui.IdentifiersLanguages.init(function() {
                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        });
    }
};

/*$(function() {
    SCWeb.core.Main.init();
});*/


SCWeb.core.Server = {
    _semanticNeighborhood: {
        commandId: 'ui_menu_view_full_semantic_neighborhood',
        commandAddr: null
    },
    _listeners: [],
    
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
    
    // ----------------------
    
    /**
     * Gets command menu structure.
     *
     * @param {Function} callback
     */
    getCommands: function(callback) {
        
        SCWeb.core.Server._fireTaskStarted();
        
        $.ajax({
            type: 'GET',
            url: 'api/commands',
            data: null,
            success: callback,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },

    /**
     *
     * @param {Array} identifiers
     * @param {String} language
     * @param {Function} callback
     */
    resolveIdentifiers: function(identifiers, language, callback) {
        var data = 'language=' + language;

        var id;
        var index;
        var i;
        for(i = 0; i < identifiers.length; i++) {
            id = identifiers[i];
            index = (i + 1) + '_';
            data += '&' + index + '=' + id;
        }

        SCWeb.core.Server._fireTaskStarted();
        //TODO: change to POST because the data may reach the limit of GET parameters string
        $.ajax({
            type: 'GET',
            url: 'api/idtf',
            data: data,
            success: callback,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },

    /**
     *
     * @param {Function} callback
     */
    getOutputLanguages: function(callback) {
        SCWeb.core.Server._fireTaskStarted();
        $.ajax({
            type: 'GET',
            url: 'api/outputLangs',
            data: null,
            success: callback,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },

    /**
     *
     * @param {Function} callback
     */
    getIdentifierLanguages: function(callback) {
        SCWeb.core.Server._fireTaskStarted();
        $.ajax({
            type: 'GET',
            url: 'api/idtfLangs',
            data: null,
            success: callback,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },
    
    /** Function to initiate user command on server
    * @param {cmd_addr} sc-addr of command
    * @param {output_addr} sc-addr of output language
    * @param {arguments_list} List that contains sc-addrs of command arguments
    * @param {callback} Function, that will be called with recieved data
    */
    doCommand: function(cmd_addr, output_addr, arguments_list, callback){

        var arguments = '';
        for (var i = 0; i < arguments_list.length; i++){
            var arg = arguments_list[i];
            arguments += i.toString() + '_=' + arg + '&';
        }
        arguments += 'cmd=' + cmd_addr + '&';
        arguments += 'output=' + output_addr;

        SCWeb.core.Server._fireTaskStarted();
        $.ajax({
            type: "GET",
            url: "api/doCommand",
            data: arguments,
            success: callback,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },

    /**
     * Gets semantic neighbourhood for the specified node.
     *
     * @param {String} scAddr The SC address of node
     * @param {String} outputLanguage The output language SC address
     * @param {Function} callback
     */
    getSemanticNeighbourhood: function(scAddr, outputLanguage, callback) {
        if(this._semanticNeighborhood.commandAddr) {
            this.doCommand(this._semanticNeighborhood.commandAddr, outputLanguage, [scAddr], callback);
        } else {
            var me = this;
            this.resolveScAddr([this._semanticNeighborhood.commandId], function(addressMap) {
                me._semanticNeighborhood.commandAddr = addressMap[me._semanticNeighborhood.commandId];
                me.doCommand(me._semanticNeighborhood.commandAddr, outputLanguage, [scAddr], callback);
            });
        }
    },
    
    /**
     * Function that resolve sc-addrs for specified sc-elements by their system identifiers
     * @param {identifiers} List of system identifiers, that need to be resolved
     * @param {callback} Callback function that calls, when sc-addrs resovled. It
     * takes object that contains map of resolved sc-addrs as parameter
     */
    resolveScAddr: function(idtfList, callback){
        var arguments = '';
        for (i = 0; i < idtfList.length; i++){
            var arg = idtfList[i];
            arguments += i.toString() + '_=' + arg + '&';
        }
        
        SCWeb.core.Server._fireTaskStarted();
        $.ajax({
            type: "GET",
            url: "api/scAddrs",
            data: arguments,
            success: callback,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },
    
    /**
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
        
        SCWeb.core.Server._fireTaskStarted();
        $.ajax({
            type: "GET",
            url: "api/linkFormat",
            data: arguments,
            success: success,
            error: error,
            complete: function(data) { 
                SCWeb.core.Server._fireTaskFinished();
            }
        });
    },
    
    
    _buildLinkContentUrl: function(linkAddr) {
        return 'api/linkContent?addr=' + linkAddr;
    },
    /**
     * Returns data of specified content
     * @param {String} addr sc-addr of sc-link to get data
     * @param {Function} success Callback function, that recieve data.
     * @param {Function} error Callback function, that calls on error
     */
    getLinkContent: function(addr, success, error) {
        SCWeb.core.Server._fireTaskStarted();
        
        $.ajax({
                url: 'api/linkContent',
                data: {"addr": addr},
                success: success,
                error: error,
                complete: function(data) { 
                    SCWeb.core.Server._fireTaskFinished();
                }
            });
    }
};


SCWeb.core.Translation = {
    
    current_language: null,
    listeners: [],

    /**
     * cached identifiers
     */
    _cacheMap: {},
    
    /** 
     * @param {Object} listener Listener object that will be notified on translation.
     * It must has two functions:
     * - getObjectsToTranslate() - funciton returns array of sc-addrs, that need to be 
     * translated
     * - updateTranslation(identifiers) - fucntion, that calls when translation finished,
     * and notify, that view must be updated
     */
    registerListener: function(listener) {
        if (this.listeners.indexOf(listener) == -1) {
            this.listeners.push(listener);
        }
    },
    
    /**
     * @param {Object} listener Listener objects that need to be unregistered
     */
    unregisterListener: function(listener) {
        var idx = this.listeners.indexOf(listener);
        if (idx >= 0) {
            this.listeners.splice(idx, 1);
        }
    },
    
    /**
     * @param {String} sc-addr of new identifiers language 
     */
    languageChanged: function(language) {
        this.current_language = language;
         
        // collect objects, that need to be translated
        var objects = [];
        for (var i = 0; i < this.listeners.length; i++) {
            objects = objects.concat(this.listeners[i].getObjectsToTranslate());
        }
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        this.translate(objects, language, function(namesMap) {
            // notify listeners for new translations
            for (var i = 0; i < self.listeners.length; i++) {
                self.listeners[i].updateTranslation(namesMap);
            }
        });
        
     },
      
    /**
     * @param {Array} objects List of sc-addrs, that need to be translated
     * @param {String} language It it value is null, then current language used
     * @param {Function} callback
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function(objects, language, callback) {
        var lang = language || this.current_language;

        var requiredNamesMap;
        var unachedAddresses = this._getUncachedNames(lang, objects);
        if(unachedAddresses.length === 0) {
            requiredNamesMap = this._getRequiredNamesMap(lang, objects);
            callback(requiredNamesMap);
        } else {
            var self = this;
            SCWeb.core.Server.resolveIdentifiers(unachedAddresses, lang, function(namesMap) {
                self._cacheNames(lang, namesMap);
                requiredNamesMap = self._getRequiredNamesMap(lang, objects);
                callback(requiredNamesMap);
            });
        }
    },

    _getUncachedNames: function(language, addresses) {
        if(!this._cacheMap[language]) {
            // nothing is cached for this language yet
            return addresses;
        } else {
            var uncachedAddressed = [];
            var scAddress;
            var i;
            for(i=0; i < addresses.length; i++) {
                scAddress = addresses[i];
                // if not in cache for the specified language
                if(!this._cacheMap[language][scAddress]) {
                    uncachedAddressed.push(scAddress);
                }
            }
            return uncachedAddressed;
        }
    },

    _cacheNames: function(language, namesMap) {
        if(!this._cacheMap[language]) {
            this._cacheMap[language] = {};
        }

        var name;
        var scAddress;
        for(scAddress in namesMap) {
            if(namesMap.hasOwnProperty(scAddress)) {
                name = namesMap[scAddress];
                this._cacheMap[language][scAddress] = name;
            }
        }

    },

    _getRequiredNamesMap: function(language, addresses) {
        var names = {};
        var scAddress;
        var i;
        for(i=0; i < addresses.length; i++) {
            scAddress = addresses[i];
            names[scAddress] = this._cacheMap[language][scAddress];
        }
        return names;
    }
};


$.namespace('SCWeb.core.ui');

SCWeb.core.ui.ArgumentsPanel = {
    _container : '#arguments_buttons',

    init : function(callback) {

        SCWeb.core.Translation.registerListener(this);

        SCWeb.core.Arguments.registerListener(this);
        SCWeb.core.Translation.registerListener(this);

        $('#arguments_clear_button').click(function() {

            SCWeb.core.Arguments.clear();
        });

        $(document).on("click", ".arguments_item", function(event) {

            var idx = $(this).attr('arg_idx');
            SCWeb.core.Arguments.removeArgumentByIndex(parseInt(idx));
        });

        if (callback) {
            callback();
        }
    },

    // ------- Arguments listener interface -----------
    argumentAppended : function(argument, idx) {

        var idx_str = idx.toString();
        var self = this;

        // translate added command
        SCWeb.core.Translation
                .translate(
                        [ argument ],
                        null,
                        function(namesMap) {

                            var value = argument;
                            if (namesMap[argument]) {
                                value = namesMap[argument];
                            }

                            var new_button = '<button class="btn arguments_item" sc_addr="'
                                    + argument
                                    + '" arg_idx="'
                                    + idx_str
                                    + '" id="argument_'
                                    + idx_str
                                    + '">'
                                    + value + '</button>';
                            $(self._container).append(new_button);
                        });

    },

    argumentRemoved : function(argument, idx) {

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

    argumentsCleared : function() {

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

    /**
     * @return Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate : function() {

        return SCWeb.core.Arguments._arguments;
    }

};


SCWeb.core.ui.IdentifiersLanguages = {
    _menuId: 'select_idtf_language',
    _languages: null,

    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        this.update(callback);
    },

    update: function(callback) {
        var me = this;
        SCWeb.core.Server.getIdentifierLanguages(function(languages) {
            me._updateLanguages(languages);
            if(callback) {
                callback();
            }
        });
    },

    getLanguage: function() {
        return $('#' + this._menuId + ' :selected').val();
    },

    _updateLanguages: function(languages) {
        this._languages = [];

        var dropdownHtml = '';

        var i;
        var language;
        for(i = 0; i < languages.length; i++) {
            language = languages[i];
            dropdownHtml += '<option value="' + language + '"' + 'id="idtf_lang_' + language + '" sc_addr="' + language + '">' + language + '</option>';
            this._languages.push(language);
        }

        $('#' + this._menuId).append(dropdownHtml);

        SCWeb.core.Translation.languageChanged(this.getLanguage());        

        this._registerMenuHandler();

    },

    _registerMenuHandler: function() {
        var me = this;
        $('#' + this._menuId).change(function() {
                var language = me.getLanguage();
                SCWeb.core.Translation.languageChanged(language);
            });
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#' + this._menuId + ' [sc_addr]').each(function(index, element) {
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
        return this._languages;
    }
};


SCWeb.core.ui.Locker = {
    _locker: null,

    show: function() {
        if(!this._locker) {
            this._locker = $('<div id="uilocker"></div>').appendTo('body');
        }
        this._locker.addClass('shown');
    },

    hide: function() {
        this._locker.removeClass('shown');
    }
};


SCWeb.core.ui.Menu = {
    _menuContainerId: 'menu_container',
    _items: null,

    init: function(callback) {
        var me = this;
        
        // register for translation updates
        SCWeb.core.Translation.registerListener(this);
        
        SCWeb.core.Server.getCommands(function(menuData) {
            me._build(menuData);
            if(callback) {
                callback();
            }
        });
    },

    _build: function(menuData) {

        this._items = [];

        var menuHtml = '<ul class="nav">';

        //TODO: change to children, remove intermediate 'childs'
        if(menuData.hasOwnProperty('childs')) {
            var id;
            var subMenu;
            var i;
            for(i = 0; i < menuData.childs.length; i++) {
                subMenu = menuData.childs[i];
                menuHtml += this._parseMenuItem(subMenu);
            }
        }

        menuHtml += '</ul>';

        $('#' + this._menuContainerId).append(menuHtml);

        this._registerMenuHandler();
    },

    _parseMenuItem: function(item) {

        this._items.push(item.id);

        var item_class = 'dropdown';
        var itemHtml = '';
        if(item.cmd_type == 'atom') {
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id + '"sc_addr="' + item.id + '" class="menu_item ' + item.cmd_type + '" >' + item.id + '</a>';
        } else {
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id + '"sc_addr="' + item.id + '" class="menu_item ' + item.cmd_type + ' dropdown-toggle" data-toggle="dropdown" href="#" >' + item.id + '</a>';
        }


        if(item.hasOwnProperty('childs')) {
            itemHtml += '<ul class="dropdown-menu">';
            var id;
            var subMenu;
            var i;
            for(i = 0; i < item.childs.length; i++) {
                subMenu = item.childs[i];
                itemHtml += this._parseMenuItem(subMenu);
            }
            itemHtml += '</ul>';
        }
        return itemHtml + '</li>';
    },

    _registerMenuHandler: function() {
        $('.menu_item').click(function() {
            
            var sc_addr = $(this).attr('sc_addr');
            // append as argument
            if (SCWeb.core.utils.Keyboard.ctrl) {
                SCWeb.core.Arguments.appendArgument(sc_addr);
            }else{
            
                if ($(this).hasClass('cmd_atom')) {
                    
                    var output_lang = SCWeb.core.ui.Windows.getActiveWindowOtputLanguage();//SCWeb.core.ui.OutputLanguages.getLanguage();
                    
                    if (!output_lang) {
                        alert("There are no any output language selected");
                    }else{
                    
                        var arguments_list = SCWeb.core.Arguments._arguments;
                        var current_window = SCWeb.core.ui.Windows.active_window;
                        if (!current_window) {
                            alert("There are no any active window to output answer");
                        }else{
                            SCWeb.core.Server.doCommand(sc_addr, output_lang, arguments_list, function(data) {
                                SCWeb.core.ui.Windows.sendDataToWindow(current_window, data);
                            });
                        }
                    }
                }
            }
        });
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#menu_container [sc_addr]').each(function(index, element) {
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


SCWeb.core.ui.OutputLanguages = {
    _menuId: 'select_output_language',
    _languages: [],
    _transl_languages: [], // list of output languages that has translation support

    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        SCWeb.core.ComponentManager.setListener(this);
        
        this.update(callback);
    },

    update: function(callback) {
        var self = this;
        SCWeb.core.Server.getOutputLanguages(function(languages) {
            self._updateLanguages(languages);
            if(callback) {
                callback();
            }
        });
    },

    getLanguage: function() {
        return $('#' + this._menuId + ' :selected').val();
    },

    /**
     * Appends language into selection control
     */
    _appendLanguageToControl: function(language) {
        
        $('#' + this._menuId).append(
            '<option value="' + language + '"' + 'id="output_lang_' + language + '" sc_addr="' + language + '">' + language + '</option>'
        );
    },

    _updateLanguages: function(languages) {

        this._transl_languages = [];
        var language;
        for(var i = 0; i < languages.length; i++) {
            
            language = languages[i];
            this._transl_languages.push(language);
        }

    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#select_output_language [sc_addr]').each(function(index, element) {
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
        return this._languages;
    },
    
    // ----------- Component listener ----------------
    componentRegistered: function(compDescr) {
        var sc_addr = compDescr.outputLangAddr;
        if (sc_addr && this._transl_languages.indexOf(sc_addr) >= 0) {
            this._appendLanguageToControl(sc_addr);
            this._languages.push(sc_addr);
        }
    },
    
    componentUnregistered: function(compDescr) {
        
    }
};


SCWeb.core.ui.TaskPanel = {
    _container: '#task_panel',
    _text_container: '#task_num',
    _task_num: 0,
    
    init: function(callback) {
        
        SCWeb.core.Server.appendListener(this);
        
        if (callback)
            callback();
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
    },
    
    taskFinished: function() {
        this._task_num--;
        this.updatePanel();
    }
};


SCWeb.core.ui.Windows = {
    
    _container: "#tabs_container",
    window_counter: 0,
    windows: {},   // map of currently created windows
    active_window: null,
    
    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        
        $('#btn_add_new_window').click($.proxy(this.onCreateWindow, this));
        
        $(document).on("click", ".sc_window", function(event) {
            var idx = $(this).attr('window_num');
            SCWeb.core.ui.Windows.setActiveWindow(idx);
        });

        $('#tabs_container').delegate('button.close', 'click', function(event) {
            var windowId = $(this).attr('window_num');
            SCWeb.core.ui.Windows.destroyWindow(windowId);
            // to prevent handling 'click' event on a '.sc_window' tab
            event.stopPropagation();
        });
        
        if (callback)
            callback();
    },
    
    /**
     * Event hadler for new window button
     */
    onCreateWindow: function() {
        
        var outputLang = SCWeb.core.ui.OutputLanguages.getLanguage();
        
        if (outputLang) {
            this.createWindow(outputLang);
        }
    },
    
    /**
     * Create new window with specified output language
     * @param {String} outputLang SC-addr of output language
     * @return Returns created window id
     */
    createWindow: function(outputLang) {
        
        var window_num_str = (++this.window_counter).toString();
        var window_id = "window_" + window_num_str;
        var window_data_container = 'window_data_' + this.window_counter;
        
        // fist of all we need to append tab
        $('#tabs_container').append('<li id="' + window_id + '" class="sc_window" window_num="' + window_num_str + '"><a href="#">Window ' + window_num_str + '</a><button class="close" window_num="' + window_num_str + '"><i class="icon-remove-sign"></i></button></li>');
        $('#tabs_data_container').append('<div id="' + window_data_container + '" class="sc_window_data" window_num="' + window_num_str + '"></div>');
        var config = {'container': window_data_container};
        var window = SCWeb.core.ComponentManager.createComponentInstanceByOutputLanguage(config, SCWeb.core.ComponentType.viewer, outputLang);
        this.windows[this.window_counter] = window;

        this._bindSemanticNeighbourhoodHandler(window_num_str, outputLang);
        
        this.setActiveWindow(this.window_counter);
        return this.window_counter;
    },
    
    /**
     * Setup specified window as active
     * @param {String} windowId Id of window, that need to be activated
     */
    setActiveWindow: function(windowId) {
        var self = this;
        this.active_window = null;
        var window_id_str = windowId.toString();
        $(this._container + ' .sc_window').each(function (index, element) {
            var v = $(this).attr('window_num');
            
            $(this).removeClass('active');
            
            if (v == window_id_str) {
                $(this).addClass('active');
                self.active_window = windowId;
            }
        });
        
        $('#tabs_data_container .sc_window_data').each(function (index, element) {
            var v = $(this).attr('window_num');
            
            if (v == window_id_str) {
                $(this).removeClass('no_display');
                self.active_window = windowId;
            }else{
                $(this).addClass('no_display');
            }
        });

        // translate activated window
        this.updateTranslation();
    },

    destroyWindow: function(windowId) {
        var window = this.windows[windowId];

        this._unbindSemanticNeighbourhoodHandler(windowId);

        window.destroy();
        delete this.windows[windowId];
        var tabSelector = '#tabs_container li[window_num=' + windowId + ']';
        var dataContainerSelector = '#tabs_data_container div[window_num=' + windowId + ']';
        $(tabSelector).remove();
        $(dataContainerSelector).remove();
        if(this.active_window == windowId) {
            this.active_window = null;
            var w;
            for(w in this.windows) {
                this.active_window = w;
                this.setActiveWindow(w);
                return;
            }
        }
    },

    /**
     * Function, to send data into specified window
     * @param {Number} windowId Id of a window, where data need to be sent
     * @param {String} data Data that need to sent
     */
    sendDataToWindow: function(windowId, data) {
        var wind = SCWeb.core.ui.Windows.windows[windowId];
        
        
        if (wind) {
            wind.receiveData(data);
            wind.translateIdentifiers(SCWeb.core.Translation.current_language);
            
        }
    },
    
    /**
     * Returns sc-addr of output language for currently active window
     * If there are no any active windows, thern returns null
     */
    getActiveWindowOtputLanguage: function() {
        if (this.active_window) {
            var window = this.windows[this.active_window];
            if (window) {
                return window._outputLang;
            }
        }
        
        return null;
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        var wind = SCWeb.core.ui.Windows.windows[this.active_window];
        if (wind) {
            var current_language = SCWeb.core.Translation.current_language;
            if (wind.getIdentifiersLanguage() != current_language) {
                wind.translateIdentifiers(current_language);
            }
        }
    },
    
    /**
     * @return {Array} Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate: function() {
        return [];
    },

    /**
     * Binds component event handler for the obtaining semantic neighbourhood.
     *
     * @param {String} windowId The component window id
     * @param {String} outputLanguage The SC address of the component output language
     */
    _bindSemanticNeighbourhoodHandler: function(windowId, outputLanguage) {
        var windowContainerId = '#window_data_' + windowId;
        $(windowContainerId).bind('semanticNeighbourhood', function(event, scAddr) {
            SCWeb.core.Server.getSemanticNeighbourhood(scAddr, outputLanguage, function(data) {
                SCWeb.core.ui.Windows.sendDataToWindow(windowId, data);
            });
        });
    },

    /**
     * Unbinds component event handler for the obtaining semantic neighbourhood.
     *
     * @param {String} windowId The component window id
     */
    _unbindSemanticNeighbourhoodHandler: function(windowId) {
        var windowContainerId = '#window_data_' + windowId;
        $(windowContainerId).unbind('semanticNeighbourhood');
    },
    
    /**
     * Create viewers for specified sc-links
     * @param {Array} linkAddrs List of sc-link addrs
     * @param {Object} containers Map of viewer containers (key: sc-link addr, value: container)
     * @param {Function} success Function that calls on success result
     * @param {Function} error Function that calls on error result
     */
    createViewersForScLinks: function(linkAddrs, container, success, error) {
        SCWeb.core.Server.getLinksFormat(linkAddrs, 
            function(formats) {
                
                for (var i = 0; i < linkAddrs.length; i++) {
                    var fmt = formats[linkAddrs[i]];
                    if (fmt) {
                        var config = {"dataAddr": linkAddrs[i], "container": container};
                        SCWeb.core.ComponentManager.createComponentInstanceByFormat(config, 
                                SCWeb.core.ComponentType.viewer, fmt);
                    }
                }
                
                success();
            },
            error
        );
    }
};


$.namespace('SCWeb.core.utils');


SCWeb.core.utils.Keyboard = {
    
    ctrl: false,
    shift: false,
    alt: false,
    
    init: function(callback) {
        
        /*$(document).keydown(function(e) {
            console.log(e.which);
        });*/
        
        var self = this;
        $(document).keydown($.proxy(this.keyDown, this));
        $(document).keyup($.proxy(this.keyUp, this));
        
        callback();
    },
    
    /**
     * @param {} keyEvent Key event from jquery
     */
    keyDown: function(keyEvent) {
        this._updateKeyState(keyEvent.which, true);
    },
    
    /**
     * @param {} keyEvent Key event from jquery
     */
    keyUp: function(keyEvent) {
        this._updateKeyState(keyEvent.which, false);
    },
    
    /**
     * @param {} keyCode Code of key that need to be updated
     * @param {boolean} value New value of key state
     */
    _updateKeyState: function(keyCode, value) {
        
        if (keyCode == 17) this.ctrl = value;
        if (keyCode == 16) this.shift = value;
        if (keyCode == 18) this.alt = value;
    }

};




