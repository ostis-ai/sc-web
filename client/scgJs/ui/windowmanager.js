SCWeb.ui.WindowManager = {

    // dictionary that contains information about windows corresponding to history items
    windows: [],
    window_count: 0,
    MAX_WINDOWS: 20,
    window_active_formats: {},
    sandboxes: {},
    active_window_id: null,
    active_history_addr: null,


    // function to create hash from question addr and format addr
    hash_addr: function (question_addr, fmt_addr) {
        return question_addr + '_' + fmt_addr;
    },

    isWindowExist: function (id) {
        return this.windows.indexOf(id) !== -1;
    },
    init: function (params) {
        return new Promise((resolve, reject) => {
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
            $('#history-item-langs').html(ext_langs_items).find('[sc_addr]').click(function (event) {

                if (SCWeb.ui.ArgumentsPanel.isArgumentAddState()) return;

                var question_addr = self.active_history_addr;
                var lang_addr = $(this).attr('sc_addr');

                var fmt_addr = SCWeb.core.ComponentManager.getPrimaryFormatForExtLang(lang_addr);
                var lang = SCWeb.core.Translation.getCurrentLanguage();
                if (fmt_addr) {
                    var command_state = new SCWeb.core.CommandState(null, null, fmt_addr, lang);
                    var id = self.hash_addr(question_addr, command_state);
                    if (self.isWindowExist(id)) {
                        self.setWindowActive(id);
                    } else {
                        self.appendWindow(question_addr, command_state);
                        self.window_active_formats[question_addr] = command_state.format;
                        self.windows[self.hash_addr(question_addr, command_state.format)] = question_addr;
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

            $('#history-item-link').popover({
                content: $.proxy(self.getUrlToCurrentWindow, self)
            });

            // listen translation events
            SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
            SCWeb.core.EventManager.subscribe("translation/get", this, function (objects) {
                $('#window-header-tools [sc_addr]').each(function (index, element) {
                    objects.push($(element).attr('sc_addr'));
                });
                $('#history-container [sc_addr]').each(function (index, element) {
                    objects.push($(element).attr('sc_addr'));
                });
            });

            resolve();
        });
        },

    getUrlToCurrentWindow: function () {
        return window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/?question=" + this.active_history_addr;
    },

    // ----------- History ------------
    /**
     * Append new tab into history
     * @param {String} question_addr sc-addr of item to append into history
     * @param command_state
     */
    appendHistoryItem: function (question_addr, command_state) {
        // @todo check if tab exist        
        var tab_html = '<a class="list-group-item history-item ui-no-tooltip" sc_addr="' + question_addr + '">' +
            '<p>' + question_addr + '</p>' +
            '</a>';

        this.history_tabs.prepend(tab_html);

        // get translation and create window
        if (!command_state.format)
        {
            var ext_lang_addr = SCWeb.core.Main.getDefaultExternalLang();
            command_state.format = SCWeb.core.ComponentManager.getPrimaryFormatForExtLang(ext_lang_addr);
        }

        if (!command_state.lang)
            command_state.lang = SCWeb.core.Translation.getCurrentLanguage();

        if (command_state.format) {
            var id = this.hash_addr(question_addr, command_state.format, command_state.command_args)
            if (this.isWindowExist(id)) {
                this.setWindowActive(id);
            } else {
                this.appendWindow(question_addr, command_state);
                this.window_active_formats[question_addr] = command_state.format;
            }
        }

        this.setHistoryItemActive(question_addr);

        // setup input handlers
        var self = this;
        this.history_tabs.find("[sc_addr]").click(function (event) {
            var question_addr = $(this).attr('sc_addr');
            self.setHistoryItemActive(question_addr);
            self.setWindowActive(self.hash_addr(question_addr, self.window_active_formats[question_addr]));
        });

        // translate added item
        SCWeb.core.Translation.translate([question_addr]).then(function (namesMap) {
            value = namesMap[question_addr];
            if (value) {
                $(self.history_tabs_id + " [sc_addr='" + question_addr + "']").text(value);
            }
        });
    },

        /**
     * Activate previously opened window or append new one if it doesn't exist
     * @param {String} question_addr sc-addr of item to append into history
     * @param {SCWeb.core.CommandState} command_state structure with command's address, arguments and output format
     */
        activateWindow: function (question_addr, command_state) {
            if(!command_state.format) return;
    
            const id = this.hash_addr(question_addr, command_state.format)
            if (this.isWindowExist(id)) {
                return this.setWindowActive(id);
            }
            this.appendWindow(question_addr, command_state);
            this.window_active_formats[question_addr] = command_state.format;
        },

    /**
     * Removes specified history item
     * @param {String} addr sc-addr of item to remove from history
     */
    removeHistoryItem: function (addr) {
        this.history_tabs.find("[sc_addr='" + addr + "']").remove();
    },

    /**
     * Set new active history item
     * @param {String} addr sc-addr of history item
     */
    setHistoryItemActive: function (addr) {
        if (this.active_history_addr) {
            this.history_tabs.find("[sc_addr='" + this.active_history_addr + "']").removeClass('active').find('.histoy-item-btn').addClass('hidden');
        }

        this.active_history_addr = addr;
        this.history_tabs.find("[sc_addr='" + this.active_history_addr + "']").addClass('active').find('.histoy-item-btn').removeClass('hidden');
    },


    // ------------ Windows ------------
    /**
     * Append new window
     * @param question_addr
     * @param command_state
     */
    appendWindow: function (question_addr, command_state) {
        var self = this;
        SCWeb.ui.Locker.show();
        var f = function (addr, is_struct) {
            var id = self.hash_addr(question_addr, command_state.format);
            if (!self.isWindowExist(id)) {
                var window_id = 'window_' + question_addr + "_format_" + command_state.format;
                var window_html = '<div class="panel panel-default sc-window" id="' + id + '" sc_addr="' + question_addr + '" sc-addr-fmt="' + command_state.format + '">' +
                    '<div class="panel-body" id="' + window_id + '"></div>'
                '</div>';
                self.window_container.prepend(window_html);

                self.hideActiveWindow();
                self.windows.push(id);
                if (self.windows.length > self.MAX_WINDOWS) {
                    const lastWindowId = self.windows.shift();
                    delete self.sandboxes[lastWindowId]
                    self.removeWindow(lastWindowId);
                }
            }
            sandbox = self.sandboxes[id];
            if (!sandbox) {
                var sandbox = SCWeb.core.ComponentManager.createWindowSandboxByFormat({
                    format_addr: command_state.format,
                    addr: addr,
                    is_struct: is_struct,
                    container: window_id,
                    window_id: id,
                    command_state: command_state,
                    canEdit: true    //! TODO: check user rights
                });
            }
            if (sandbox) {
                self.sandboxes[id] = sandbox;
                self.setWindowActive(id);
            } else {
                self.showActiveWindow();
                throw "Error while create window";
            }
            SCWeb.ui.Locker.hide();
        };

        var translated = function () {
            SCWeb.core.Server.getAnswerTranslated(question_addr, command_state.format, command_state.lang, function (d) {
                f(d.link, false);
            });
        };

        if (SCWeb.core.ComponentManager.isStructSupported(command_state.format)) {
            // determine answer structure
            window.scHelper.getAnswer(question_addr).then(function (addr) {
                f(addr, true);
            }).catch(function (v) {
                translated();
            });
        } else
            translated();
    },

    /**
     * Remove specified window
     * @param {String} addr sc-addr of window to remove
     */
    removeWindow: function (id) {
        this.window_container.find(`#${id}`).remove();
    },

    /**
     * Makes window with specified addr active
     * @param {String} addr sc-addr of window to make active
     */
    setWindowActive: function (id) {
        this.hideActiveWindow();
        this.active_window_id = id;
        this.showActiveWindow();
    },

    hideActiveWindow: function () {
        if (this.active_window_id)
            this.window_container.find("#" + this.active_window_id).addClass('hidden');
    },

    showActiveWindow: function () {
        if (this.active_window_id)
            this.window_container.find("#" + this.active_window_id).removeClass('hidden');
        SCWeb.ui.OpenComponentHandler.callOpenComponentCallback(this.active_window_id);
    },

    getActiveWindow: function (id) {
        if (this.active_window_id)
            return this.window_container.find("#" + this.active_window_id);
    },

    getActiveWindowId: function () {
        return this.active_window_id;
    },

    /*!
     * Genarate html for new window container
     * @param {String} containerId ID that will be set to container
     * @param {String} controlClasses Classes that will be added to controls
     * @param {String} containerClasses Classes that will be added to container
     * @param {String} addr sc-addr of window
     */
    generateWindowContainer: function (containerId, containerClasses, controlClasses, addr) {

        return '<div class="sc-content-wrap" id="' + containerId + '_wrap"> \
                    <div class="sc-content-controls ' + controlClasses + '" sc_addr="' + addr + '"> </div> \
                    <div id="' + containerId + '" class="sc-content ' + containerClasses + '"> </div> \
                </div>';
    },

    /**
     * Create viewers for specified sc-links
     * @param {Object} links Map of viewer containers (key: sc-link addr, value: id of container)
     */
    createViewersForScLinks: function (links) {
        return new Promise((resolve)=> {
            (function (links) {
                SCWeb.core.Server.getLinksFormat(links).then(
                  function (formats) {
                      let result = {};
                      for (const id in links) {
                          const link = links[id];

                          const fmt = formats[id];
                          const addr = link.addr;
                          const content = link.content;

                          if (fmt) {
                              const sandbox = SCWeb.core.ComponentManager.createWindowSandboxByFormat({
                                  format_addr: fmt,
                                  addr: addr,
                                  content: content,
                                  is_struct: false,
                                  container: id,
                                  canEdit: false
                              });
                              if (sandbox) {
                                  result[id] = sandbox;
                              }
                          }
                      }

                      resolve(result);
                  }
                );
            })(links);
        })
    },

    /** Create viewers for specified sc-structures
     * @param {Object} containers_map Map of viewer containers (id: id of container, value: {key: sc-struct addr, ext_lang_addr: sc-addr of external language}})
     */
    createViewersForScStructs: function (containers_map) {
        var res = {};
        for (var cntId in containers_map) {
            if (!containers_map.hasOwnProperty(cntId))
                continue;

            var info = containers_map[cntId];
            res[cntId] = SCWeb.core.ComponentManager.createWindowSandboxByExtLang({
                ext_lang_addr: info.ext_lang_addr,
                addr: info.addr,
                is_struct: true,
                container: cntId,
                canEdit: false
            });
        }
        return res;
    },


    // ---------- Translation listener interface ------------
    updateTranslation: function (namesMap) {
        // apply translation
        $('#window-header-tools [sc_addr]:not(.btn)').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });

        $('#history-container [sc_addr]:not(.btn)').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });

    },
};
