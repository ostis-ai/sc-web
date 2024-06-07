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
    resolveIdentifiers: async function (objects) {
        if (!objects.length) {
            return {};
        }

        const self = this;

        const getKey = (addr) => {
            return self._current_language + '/' + addr;
        }

        let result = {}, used = {};
        let notChecked = [];
        objects.forEach(id => {
            if (used[id]) return; // skip objects, that was processed
            used[id] = true;

            let cached = this._identifiers_cache.get(getKey(id));
            if (cached) {
                if (cached !== '.') {
                    result[id] = cached;
                }
                return;
            }

            notChecked.push(id);
        });

        const getIdentifierLink = async function (addr) {
            const LINK = "_link";

            const mainIdtfTemplate = new sc.ScTemplate();
            mainIdtfTemplate.tripleWithRelation(
                addr,
                sc.ScType.EdgeDCommonVar,
                [sc.ScType.LinkVar, LINK],
                sc.ScType.EdgeAccessVarPosPerm,
                new sc.ScAddr(window.scKeynodes["nrel_main_idtf"]),
            );
            mainIdtfTemplate.triple(
                new sc.ScAddr(self._current_language),
                sc.ScType.EdgeAccessVarPosPerm,
                LINK,
            );
            let result = await window.scClient.templateSearch(mainIdtfTemplate);

            if (result.length) {
                return result[0].get(LINK);
            }

            const mainIdtfNoLanguageTemplate = new sc.ScTemplate();
            mainIdtfNoLanguageTemplate.tripleWithRelation(
                addr,
                sc.ScType.EdgeDCommonVar,
                [sc.ScType.LinkVar, LINK],
                sc.ScType.EdgeAccessVarPosPerm,
                new sc.ScAddr(window.scKeynodes["nrel_main_idtf"]),
            );
            let mainIdtfNoLanguageResult = await window.scClient.templateSearch(mainIdtfNoLanguageTemplate);

            if (mainIdtfNoLanguageResult.length) {
                return mainIdtfNoLanguageResult[0].get(LINK);
            }

            const sysIdtfTemplate = new sc.ScTemplate();
            sysIdtfTemplate.tripleWithRelation(
                addr,
                sc.ScType.EdgeDCommonVar,
                [sc.ScType.LinkVar, LINK],
                sc.ScType.EdgeAccessVarPosPerm,
                new sc.ScAddr(window.scKeynodes["nrel_system_identifier"]),
            );

            result = await window.scClient.templateSearch(sysIdtfTemplate);
            if (result.length) {
                return result[0].get(LINK);
            }

            return addr;
        }

        if (arguments.length) {
            const elements = notChecked.map(id => new sc.ScAddr(parseInt(id)));
            const links = await Promise.all(elements.map(async (element) => {
                    const elementIdtf = await getIdentifierLink(element);
                    if ((elementIdtf !== element)) return elementIdtf;
                }
            ));
            let linksWithoutUndefined = links.filter(link => link !== undefined);
            if (linksWithoutUndefined.length)
            {
                const contents = await window.scClient.getLinkContents(linksWithoutUndefined);
                contents.forEach((content, index) => {
                    result[notChecked[index]] = content.data;
                });
            }
        }
        return result;
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
     * @param {lang_addr} sc-addr of language to translate answer
     * @param {callback} Function, that will be called with received data in specified format
     */
    getAnswerTranslated: function (question_addr, format_addr, lang_addr, callback) {
        this._push_task({
            type: "POST",
            url: "api/question/answer/translate/",
            data: {"question": question_addr, "format": format_addr, "lang": lang_addr},
            success: callback
        });
    },


    /*!
     * Function that resolve sc-addrs for specified sc-elements by their system identifiers
     * @param {identifiers} List of system identifiers, that need to be resolved
     * @param {callback} Callback function that calls, when sc-addrs resolved. It
     * takes object that contains map of resolved sc-addrs as parameter
     */
    resolveScAddr: async function (idtfList) {
        let self = this;
        let notResolved = [], result = {}, used = {};

        for (let i = 0; i < idtfList.length; i++) {
            const idtf = idtfList[i];

            const cached = this._sys_identifiers_cache.get(idtf);
            if (cached) {
                result[idtf] = cached;
                continue;
            }

            if (used[idtf]) continue;
            used[idtf] = true;

            notResolved.push(idtf);
        }

        if (notResolved.length === 0) {
            return result;
        } else {
            return await (async function (result, notResolved) {
                let keynodesData = [];

                for (let i in notResolved) {
                    const idtf = notResolved[i];

                    if (idtf)
                        keynodesData.push({id: idtf, type: new sc.ScType()});
                }

                const addrs = await window.scClient.resolveKeynodes(keynodesData);
                for (let i in addrs) {
                    result[i] = addrs[i].value;
                }

                return result;
            })(result, notResolved);
        }
    },

    /*!
     * Function that get sc-link data from server
     * @param {Array} links List of sc-link addrs to get data
     * @param {Function} success Callback function, that receive map of
     * resolved sc-links format (key: sc-link addr, value: format addr).
     * @param {Function} error Callback function, that calls on error
     */
    getLinksFormat: async function (links) {
        let formats = {}

        for (const id in links) {
            const link = links[id];
            const addrStr = link.addr;

            if (addrStr && link.state !== SCgObjectState.NewInMemory) {
                const addr = new sc.ScAddr(parseInt(addrStr));

                const template = new sc.ScTemplate();
                template.tripleWithRelation(
                    addr,
                    sc.ScType.EdgeDCommonVar,
                    sc.ScType.NodeVar,
                    sc.ScType.EdgeAccessVarPosPerm,
                    new sc.ScAddr(window.scKeynodes["nrel_format"]),
                );
                const format_result = await window.scClient.templateSearch(template);

                if (format_result.length) {
                    formats[id] = format_result[0].get(2).value;
                }
                else {
                    formats[id] = window.scKeynodes["format_txt"];
                }
            }
            else {
                let formatAddr = window.scKeynodes['format_txt'];
                switch (link.contentType) {
                    case 'image':
                        formatAddr = window.scKeynodes['format_png'];
                        break;
                    case 'pdf':
                        formatAddr = window.scKeynodes['format_pdf'];
                        break;
                    case 'html':
                        formatAddr = window.scKeynodes['format_html'];
                        break;
                }

                formats[id] = formatAddr;
            }
        }

        return formats;
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


