const scHelper = null;
const scKeynodes = null;
const currentYear = new Date().getFullYear();

function ScClientCreate() {
    let res, rej;
    let scClient = new sc.ScClient(serverHost);
    return new Promise((resolve, reject) => {
        res = resolve(scClient);
        rej = reject;
    });
}

SCWeb.core.Main = {
    window_types: [],
    idtf_modes: [],
    menu_commands: {},
    default_cmd_str: "ui_menu_view_full_semantic_neighborhood",

    /**
     * Initialize sc-web core and ui
     * @param {Object} params Initialization parameters.
     * There are required parameters:
     * - menu_container_id - id of dom element, that will contain menu items
     */
    init: function (params) {
        return new Promise((resolve)=>{
            const self = this;
            //SCWeb.ui.Locker.show();

            SCWeb.core.Server._initialize();
            ScClientCreate().then(function (client) {
                window.scClient = client;
                window.scHelper = new ScHelper(window.scClient);
                window.scKeynodes = new ScKeynodes(window.scHelper);

                window.scKeynodes.init().then(function () {
                    window.scHelper.init().then(function () {

                        if (window._unit_tests)
                            window._unit_tests();

                        SCWeb.ui.TaskPanel.init().then(function () {
                            SCWeb.core.Server.init(function (data) {
                                self.menu_commands = data.menu_commands;
                                self.user = data.user;

                                data.menu_container_id = params.menu_container_id;

                                SCWeb.core.Translation.fireLanguageChanged(self.user.current_lang);

                                Promise.all([SCWeb.ui.Core.init(data),
                                    SCWeb.core.ComponentManager.init(),
                                    SCWeb.core.Translation.update()
                                ])
                                  .then(function () {
                                      resolve();

                                      const url = parseURL(window.location.href);
                                      if (url.searchObject && SCWeb.core.Main.pageShowedForUrlParameters(url.searchObject)) {
                                          return;
                                      }
                                      SCWeb.core.Main.showDefaultPage(params);
                                  });
                            });
                        });
                    });

                });
            });
        })
    },

    _initUI: function () {

    },

    pageShowedForUrlParameters(urlObject) {
        return SCWeb.core.Main.questionParameterProcessed(urlObject)
            || SCWeb.core.Main.systemIdentifierParameterProcessed(urlObject)
            || SCWeb.core.Main.commandParameterProcessed(urlObject);
    },

    questionParameterProcessed(urlObject) {
        const question = urlObject['question'];
        if (question) {
            /// @todo Check question is really a question
            const commandState = new SCWeb.core.CommandState(question, null, null);
            SCWeb.ui.WindowManager.appendHistoryItem(question, commandState);
            return true;
        }
        return false;
    },

    systemIdentifierParameterProcessed(urlObject) {
        const sys_id = urlObject['sys_id'];
        const scg_view = urlObject['scg_structure_view_only'];
        if (sys_id) {
            SCWeb.core.Main.doDefaultCommandWithSystemIdentifier([sys_id]);
            window.history.replaceState(null, null, window.location.pathname);
            if (scg_view){
                $('#window-header-tools').hide();
                $('#static-window-container').hide();
                $('#header').hide();
                $('#footer').hide();
                $('#window-container').css({'padding-right':'', 'padding-left':''});
                this.waitForElm('.sc-contour').then(() => {
                    $('#window-container').children().children().children().children().hide();
                    $('.sc-contour').css({'height':'97%','width':'97%','position':'absolute'});
                    $('.scs-scn-view-toogle-button').hide().click();
                    $("[id*='tools-']").parent().css("height", "100%");
                    $("[id*='tools-']").parent().parent().css("height", "100%");
                });
            }
            return true;
        }
        return false;
    },

    waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
    
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
    
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    },

    commandParameterProcessed(urlObject) {
        const command_identifier = urlObject['command_id'];
        if (command_identifier) {
            const parameters = Object.keys(urlObject);
            const args = [];
            for (let param of parameters) {
                if (/^arg/gi.test(param)) {
                    args.push(urlObject[param]);
                }
            }
            SCWeb.core.Main.doCommandByIdentifier(command_identifier, args);
            window.history.replaceState(null, null, window.location.pathname);
            return true;
        }
        return false;
    },

    showDefaultPage: async function (params) {

        function start(a) {
            SCWeb.core.Main.doDefaultCommand([a]);
            if (params.first_time)
                $('#help-modal').modal({"keyboard": true});
        }

        const argumentAddr = window.scKeynodes['ui_start_sc_element'];
        let startScElements = await window.scHelper.getSetElements(argumentAddr);
        if (startScElements.length) {
            start(startScElements[0]);
        } else {
            start(argumentAddr);
        }
        $('.copyright').text(`Copyright © 2012 - ${currentYear} OSTIS`);
    },

    /**
     * Returns sc-addr of preferred output language for current user
     */
    getDefaultExternalLang: function () {
        return this.user.default_ext_lang;
    },

    /**
     * Initiate user interface command
     * @param {String} cmd_addr sc-addr of user command
     * @param {Array} cmd_args Array of sc-addrs with command arguments
     */
    doCommand: function (cmd_addr, cmd_args) {
        SCWeb.core.Arguments.clear();
        SCWeb.core.Server.doCommand(cmd_addr, cmd_args, function (result) {
            if (result.question !== undefined) {
                const commandState = new SCWeb.core.CommandState(cmd_addr, cmd_args);
                SCWeb.ui.WindowManager.appendHistoryItem(result.question, commandState);
            } else if (result.command !== undefined) {

            } else {
                alert("There are no any answer. Try another request");
            }
        });
    },

    /**
     * Initiate user interface command
     * @param {String} cmd_identifier system identifier of user command
     * @param {Array} cmd_args system identifiers of command arguments
     */
    doCommandByIdentifier: function (cmd_identifier, cmd_args) {
        const self = this;
        SCWeb.core.Arguments.clear();
        SCWeb.core.Server.resolveScAddr([cmd_identifier].concat(cmd_args)).then(function (result) {
            const cmd_addr = result[cmd_identifier];
            const resolved_args = [];
            cmd_args.forEach(function (argument) {
                resolved_args.push(result[argument]);
            })
            self.doCommand(cmd_addr, resolved_args);
        })
    },

    doCommandWithPromise: function (command_state) {
        return new Promise(function (resolve, reject) {
            SCWeb.core.Server.doCommand(command_state.command_addr, command_state.command_args, function (result) {
                if (result.question !== undefined) {
                    resolve(result.question)
                } else if (result.command !== undefined) {

                } else {
                    reject("There are no any answer. Try another request");
                }
            })
        });
    },

    getTranslatedAnswer: function (command_state) {
        return new Promise(function (resolve, reject) {
            SCWeb.core.Main.doCommandWithPromise(command_state).then(function (question_addr) {
                SCWeb.core.Server.getAnswerTranslated(question_addr, command_state.format, function (answer) {
                    resolve(answer.link);
                })
            })
        })
    },

    /**
     * Initiate user natural language command
     * @param {String} query Natural language query
     */

    doTextCommand: function (query) {
        SCWeb.core.Server.textCommand(query, function (result) {
            if (result.question !== undefined) {
                const commandState = new SCWeb.core.CommandState(null, null, null);
                SCWeb.ui.WindowManager.appendHistoryItem(result.question, commandState);
            } else if (result.command !== undefined) {

            } else {
                alert("There are no any answer. Try another request");
            }
        });
    },

    /**
     * Initiate default user interface command
     * @param {Array} cmd_args Array of sc-addrs with command arguments
     */
    doDefaultCommand: function (cmd_args) {
        if (!this.default_cmd) {
            const self = this;
            SCWeb.core.Server.resolveScAddr([this.default_cmd_str]).then(function (addrs) {
                self.default_cmd = addrs[self.default_cmd_str];
                if (self.default_cmd) {
                    self.doCommand(self.default_cmd, cmd_args);
                }
            });
        } else {
            this.doCommand(this.default_cmd, cmd_args);
        }
    },
    
    /**
     * Initiate default user interface command
     * @param {string} sys_id System identifier
     */
    doDefaultCommandWithSystemIdentifier: function (sys_id) {
        SCWeb.core.Server.resolveScAddr([sys_id]).then(function (addrs) {
            const resolvedId = addrs[sys_id];
            if (resolvedId) {
                SCWeb.core.Main.doDefaultCommand([resolvedId]);
            } else {
                SCWeb.core.Main.doDefaultCommandWithSystemIdentifier('ui_start_sc_element');
            }
        });      
    }    

};

