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

    _initialize: function () {
        const expire = 1000 * 60 * 5; // five minutes expire
        this._identifiers_cache = new AppCache({
            expire: expire,
            max: 3000
        });

        this._sys_identifiers_cache = new AppCache({
            expire: expire,
            max: 3000
        });

        SCWeb.core.EventManager.subscribe("translation/changed_language", this, function (lang_addr) {
            SCWeb.core.Server._current_language = parseInt(lang_addr);
        });
    },

    /*!
     * Append new listener to server tasks
     * @param {Object} listener Listener object.
     * It must have such functions as:
     * - taskStarted - function that calls on new task started. No any arguments
     * - taskFinished - function that calls on new task finished. No any arguments
     */
    appendListener: function (listener) {
        if (this._listeners.indexOf(listener) === -1) {
            this._listeners.push(listener);
        }
    },

    /*!
     * Removes specified listener
     * @param {Object} listener Listener object to remove
     */
    removeListener: function (listener) {
        const idx = this._listeners.indexOf(listener);
        if (idx >= 0) {
            this._listeners.splice(idx, 1);
        }
    },

    /*!
     * Notify all register listeners task started
     */
    _fireTaskStarted: function () {
        for (let i = 0; i < this._listeners.length; ++i) {
            $.proxy(this._listeners[i].taskStarted(), this._listeners[i]);
        }
    },

    /*!
     * Notify all registered listeners on task finished
     */
    _fireTaskFinished: function () {
        for (let i = 0; i < this._listeners.length; ++i) {
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
    _push_task: function (task) {
        this._fireTaskStarted();
        this._task_queue.push(task);

        if (!this._task_timeout) {
            const self = this;
            this._task_timeout = window.setInterval(function () {
                const tasks = self._pop_tasks();

                for (let idx in tasks) {
                    const task = tasks[idx];
                    self._task_active_num++;
                    $.ajax({
                        url: task.url,
                        data: task.data,
                        type: task.type,
                        success: task.success,
                        error: task.error,
                        complete: function () {
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
    _pop_tasks: function () {
        const task_num = this._task_max_active_num - this._task_active_num;
        const res = [];
        for (let i = 0; i < Math.min(task_num, this._task_queue.length); ++i) {
            res.push(this._task_queue.shift());
        }

        if (this._task_queue.length === 0) {
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
     * get received data from server as a parameter
     */
    init: function (callback) {
        $.ajax({
            url: '/api/user/',
            data: null,
            type: 'GET',
            success: function (user) {
                window.scHelper.getMainMenuCommands(window.scKeynodes.ui_main_menu).then(function (menu_commands) {
                    const data = {};
                    data['menu_commands'] = menu_commands;
                    data['user'] = user;

                    window.scHelper.getLanguages().then(function (langs) {
                        SCWeb.core.Translation.setLanguages(langs);
                        data['languages'] = langs;

                        window.scHelper.getOutputLanguages().then(function (out_langs) {
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
    resolveIdentifiers: function (objects, callback) {

        if (objects.length === 0) {
            callback({});
            return; // do nothing
        }

        let self = this;

        function getKey(addr) {
            return self._current_language + '/' + addr;
        }

        let result = {}, used = {};
        let arguments = '';
        let idx = 1;
        for (let i in objects) {
            let id = objects[i];

            if (used[id]) continue; // skip objects, that was processed
            used[id] = true;

            let cached = this._identifiers_cache.get(getKey(id));
            if (cached) {
                if (cached !== '.') {
                    result[id] = cached;
                }
                continue;
            }

            if (idx > 1)
                arguments = arguments + '&';
            arguments = arguments + idx + '_=' + id;
            idx++;
        }

        if (arguments.length === 0) { // all results cached
            callback(result);
        } else {

            this._push_task({
                type: "POST",
                url: "api/idtf/resolve/",
                data: arguments,
                success: function (idtfs) {
                    for (let k in idtfs) {
                        if (idtfs.hasOwnProperty(k)) {
                            result[k] = idtfs[k];
                        }
                    }

                    callback(result);
                },
                error: function () {
                    callback({});
                }
            });
        }
    },

    _makeArgumentsList: function (arguments_list) {
        const arguments = {};
        for (let i = 0; i < arguments_list.length; i++) {
            arguments[i.toString() + '_'] = arguments_list[i];
        }
        return arguments;
    },

    contextMenu: function (arguments_list, callback) {
        const arguments = this._makeArgumentsList(arguments_list);

        this._push_task({
            type: "GET",
            url: "api/context/",
            data: arguments,
            success: callback
        });
    },

    /*! Function to initiate user command on server
     * @param {cmd_addr} sc-addr of command
     * @param {output_addr} sc-addr of output language
     * @param {arguments_list} List that contains sc-addrs of command arguments
     * @param {callback} Function, that will be called with received data
     */
    doCommand: function (cmd_addr, arguments_list, callback) {
        const arguments = this._makeArgumentsList(arguments_list);
        arguments['cmd'] = cmd_addr;

        this._push_task({
            type: "POST",
            url: "api/cmd/do/",
            data: arguments,
            success: callback
        });
    },

    /*! Function to initiate natural language query on server
     * @param {String} query Natural language query
     * @param {callback} Function, that will be called with received data
     */
    textCommand: function (query, callback) {
        const arguments = {};
        arguments['query'] = query;

        this._push_task({
            type: "POST",
            url: "api/cmd/text/",
            data: arguments,
            success: callback
        });
    },

    /*! Function to get answer translated into specified format
     * @param {question_addr} sc-addr of question to get answer translated
     * @param {format_addr} sc-addr of format to translate answer
     * @param {callback} Function, that will be called with received data in specified format
     */
    getAnswerTranslated: function (question_addr, format_addr, callback) {
        this._push_task({
            type: "POST",
            url: "api/question/answer/translate/",
            data: {"question": question_addr, "format": format_addr},
            success: callback
        });
    },


    /*!
     * Function that resolve sc-addrs for specified sc-elements by their system identifiers
     * @param {identifiers} List of system identifiers, that need to be resolved
     * @param {callback} Callback function that calls, when sc-addrs resolved. It
     * takes object that contains map of resolved sc-addrs as parameter
     */
    resolveScAddr: function (idtfList, callback) {
        let self = this, arguments = '', need_resolve = [], result = {}, used = {};

        for (let i = 0; i < idtfList.length; i++) {
            const arg = idtfList[i];

            const cached = this._sys_identifiers_cache.get(arg);
            if (cached) {
                result[arg] = cached;
                continue;
            }

            if (used[arg]) continue;
            used[arg] = true;

            arguments += need_resolve.length.toString() + '_=' + arg + '&';
            need_resolve.push(arg);
        }

        if (need_resolve.length === 0) {
            callback(result);
        } else {
            (function (result, arguments, need_resolve, callback) {
                self._push_task({
                    type: "POST",
                    url: "api/addr/resolve/",
                    data: arguments,
                    success: function (addrs) {
                        for (let i in need_resolve) {
                            const key = need_resolve[i];
                            const addr = addrs[key];
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
     * @param {Function} success Callback function, that receive map of
     * resolved sc-links format (key: sc-link addr, value: format addr).
     * @param {Function} error Callback function, that calls on error
     */
    getLinksFormat: function (links, success, error) {
        let arguments = '';
        for (let i = 0; i < links.length; i++) {
            let arg = links[i];
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
     * @param success
     * @param {Function} error Callback function, that calls on error
     */
    getLinkContent: function (addr, success, error) {
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
    getLanguages: function (callback) {
        this._push_task({
            url: "api/languages/",
            type: "GET",
            data: null,
            success: callback
        });
    },

    /**
     * Setup default natural language for user
     * @param {String} lang_addr sc-addr of new language to set up
     * @param callback
     */
    setLanguage: function (lang_addr, callback) {
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
     * @param callback
     */
    findIdentifiersSubStr: function (str, callback) {

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
    getTooltips: function (addrs, success, error) {
        let arguments = '';
        for (let i = 0; i < addrs.length; i++) {
            let arg = addrs[i];
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


