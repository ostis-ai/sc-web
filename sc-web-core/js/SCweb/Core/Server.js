SCWeb.core.Server = {
    
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
    }
};
