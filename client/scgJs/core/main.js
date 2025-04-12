const scHelper = null;
const scKeynodes = null;

const SCgEditMode = {
    SCgModeSelect: 0,
    SCgModeConnector: 1,
    SCgModeBus: 2,
    SCgModeContour: 3,
    SCgModeLink: 4,
    SCgViewOnly: 5,

    /**
     * Check if specified mode is valid
     */
    isValid: function (mode) {
        return (mode >= this.SCgModeSelect) && (mode <= this.SCgViewOnly);
    }
};

const SCgViewMode = {
    DefaultSCgView: 0,
    DistanceBasedSCgView: 1,

    /**
     * Check if specified mode is valid
     */
    isValid: function (mode) {
        return (mode >= this.DefaultSCgView) && (mode <= this.DistanceBasedSCgView);
    }
};

// backward compatibility [scg_just_view <- scg_view_only]
const editModes = {
    'scg_just_view': SCgEditMode.SCgViewOnly,
    'scg_view_only': SCgEditMode.SCgViewOnly,
};

const viewModes = {
    'default_scg_view': SCgViewMode.DefaultSCgView,
    'distance_based_scg_view': SCgViewMode.DistanceBasedSCgView,
};

function ScClientCreate() {
    let res, rej;
    let scClient = new sc.ScClient(serverHost);
    return new Promise((resolve, reject) => {
        res = resolve(scClient);
        rej = reject;
    });
}

SCWeb.core.Main = {
    editMode: 0,
    viewMode: 0,
    window_types: [],
    idtf_modes: [],
    menu_commands: {},
    default_cmd_str: "ui_menu_view_full_semantic_neighborhood",
    add_to_history_cmd_str: "ui_menu_view_add_action_to_user_history",
    get_history_cmd_str: "ui_menu_view_get_user_action_history",

    /**
     * Initialize sc-web core and ui
     * @param {Object} params Initialization parameters.
     * There are required parameters:
     * - menu_container_id - id of dom element, that will contain menu items
     */

    init: function (params) {
        return new Promise((resolve) => {
            SCWeb.core.Server._initialize();
            ScClientCreate().then(async (client) => {
                window.scClient = client;
                window.scHelper = new ScHelper(window.scClient);
                window.scKeynodes = new ScKeynodes(window.scHelper);

                await window.scKeynodes.init()
                await window.scHelper.init()

                if (window._unit_tests) window._unit_tests();

                await SCWeb.ui.TaskPanel.init()
                SCWeb.core.Server.init(async (data) => {
                    this.menu_commands = data.menu_commands;
                    this.user = data.user;

                    data.menu_container_id = params.menu_container_id;
                    data.canEdit = params.canEdit;
                    data.isAdmin = params.isAdmin;
                    data.userName = params.userName;
                    data.menu_container_id = params.menu_container_id;

                    SCWeb.core.Translation.fireLanguageChanged(this.user.current_lang);

                    await Promise.all([
                        SCWeb.ui.Core.init(data),
                        SCWeb.core.ComponentManager.init(),
                        SCWeb.core.Translation.update()
                    ])
                    const addrs = await SCWeb.core.Server.resolveScAddr(["format_scg_json", "lang_ru"]);

                    const renderScg = (action, lang = addrs["lang_ru"]) => {
                        SCWeb.core.Translation.setLanguage(lang, () => { });
                        const commandState = new SCWeb.core.CommandState(undefined, undefined, addrs["format_scg_json"], lang);
                        SCWeb.ui.WindowManager.activateWindow(action, commandState);
                    }
                    window.renderScg = renderScg;

                    const command = { 'type': 'onInitializationFinished' };
                    window.top.postMessage(command, '*');
                    window.demoImplementation = true;

                    window.addEventListener('message', (e) => {
                        if (e.data.type === 'renderScg') {
                            renderScg(e.data.addr, e.data.lang);
                        }
                    })

                    window.addEventListener('message', (e) => {
                        if (e.data.type === 'deleteScgElement') {
                            window.deleteScgElement();
                        }
                    })

                    window.addEventListener('message', (e) => {
                        if (e.data.type === 'clearScene') {
                            window.clearScene();
                        }
                    })

                    resolve();
                });
            });
        })
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
            if (result.action !== undefined) {
                const commandState = new SCWeb.core.CommandState(cmd_addr, cmd_args);
                SCWeb.ui.WindowManager.appendHistoryItem(result.action, commandState);
            } else if (result.command !== undefined) {
            } else {
                alert("There are no any result. Try another request");
            }
        });
    },

    doCommandWithPromise: function (command_state) {
        return new Promise(function (resolve, reject) {
            SCWeb.core.Server.doCommand(command_state.command_addr, command_state.command_args, function (result) {
                if (result.action !== undefined) {
                    resolve(result.action)
                } else if (result.command !== undefined) {

                } else {
                    reject("There are no any result. Try another request");
                }
            })
        });
    },

    getTranslatedResult: function (command_state) {
        return new Promise(function (resolve) {
            SCWeb.core.Main.doCommandWithPromise(command_state).then(function (action_addr) {
                SCWeb.core.Server.getResultTranslated(action_addr, command_state.format, command_state.lang, function (result) {
                    resolve(result.link);
                })
            })
        })
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
    * Initiate user interface command
    * @param {String} cmd_addr sc-addr of user command
    * @param {Array} cmd_args Array of sc-addrs with command arguments
    */
    doCommandWithFormat: function (cmd_addr, cmd_args, fmt_addr) {
        SCWeb.core.Server.doCommand(cmd_addr, cmd_args, function (result) {
            if (result.action !== undefined) {
                const commandState = new SCWeb.core.CommandState(cmd_addr, cmd_args, fmt_addr);
                SCWeb.ui.WindowManager.appendHistoryItem(result.action, commandState);
            } else {
                alert("There are no any result. Try another request");
            }
        });
    },

    /**
     * Initiate default user interface command
     * @param {Array} cmd_args Array of sc-addrs with command arguments
     */
    doDefaultCommandWithFormat: function (cmd_args, fmt_addr) {
        if (!this.default_cmd) {
            var self = this;
            SCWeb.core.Server.resolveScAddr([this.default_cmd_str], function (addrs) {
                self.default_cmd = addrs[self.default_cmd_str];
                if (self.default_cmd) {
                    self.doCommandWithFormat(self.default_cmd, cmd_args, fmt_addr);
                }
            });
        } else {
            this.doCommandWithFormat(this.default_cmd, cmd_args, fmt_addr);
        }
    }
};
