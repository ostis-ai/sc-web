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
        this._push_task({
                type: 'GET',
                url: 'api/init',
                data: null,
                success: callback
            });
    },

    /*!
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

        //TODO: change to POST because the data may reach the limit of GET parameters string
        this._push_task({
            type: 'POST',
            url: 'api/idtf',
            data: data,
            success: callback
        });
    },
    
    /*! Function to initiate user command on server
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

        this._push_task({
            type: "GET",
            url: "api/doCommand",
            data: arguments,
            success: callback
        });
    },

    /*!
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
    
    /*!
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
        
        this._push_task({
            type: "POST",
            url: "api/scAddrs",
            data: arguments,
            success: callback
        });
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
            url: "api/linkFormat",
            data: arguments,
            success: success
        });
    },
    
    
    _buildLinkContentUrl: function(linkAddr) {
        return 'api/linkContent?addr=' + linkAddr;
    },
    
    /**
     * Returns data of specified content
     * @param {String} addr sc-addr of sc-link to get data
     * @param {Function} callback Callback function, that recieve data.
     * @param {Function} error Callback function, that calls on error
     */
    getLinkContent: function(addr, success, error) {
        
        this._push_task({
                url: 'api/linkContent',
                data: {"addr": addr},
                success: success,
            });
    }
};


