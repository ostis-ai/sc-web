ScHelper = function (sctp_client) {
    this.sctp_client = sctp_client;
};

ScHelper.prototype.init = function () {
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
ScHelper.prototype.checkEdge = function (addr1, type, addr2) {
    return this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
        [
            addr1,
            type,
            addr2
        ]);
};

/*! Function to get elements of specified set
 * @param addr {String} sc-addr of set to get elements
 * @returns Returns promise objects, that resolved with a list of set elements. If 
 * failed, that promise object rejects
 */
ScHelper.prototype.getSetElements = function (addr) {
    var dfd = new jQuery.Deferred();

    this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
        [
            addr,
            sc_type_arc_pos_const_perm,
            sc_type_node | sc_type_const
        ])
        .done(function (res) {
            var langs = [];

            for (r in res) {
                langs.push(res[r][2]);
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
ScHelper.prototype.getMainMenuCommands = function () {

    var self = this;

    function determineType(cmd_addr) {
        var dfd = new jQuery.Deferred();
        window.scHelper.checkEdge(
            window.scKeynodes.ui_user_command_class_atom,
            sc_type_arc_pos_const_perm,
            cmd_addr)
            .done(function () {
                dfd.resolve('cmd_atom');
            })
            .fail(function () {
                window.scHelper.checkEdge(
                    window.scKeynodes.ui_user_command_class_noatom,
                    sc_type_arc_pos_const_perm,
                    cmd_addr)
                    .done(function () {
                        dfd.resolve('cmd_noatom');
                    })
                    .fail(function () {
                        dfd.resolve('unknown');
                    });
            });

        return dfd.promise();
    }

    function parseCommand(cmd_addr, parent_cmd) {
        var dfd = new jQuery.Deferred();

        // determine command type
        determineType(cmd_addr)
            .done(function (type) {
                var res = {};
                res['cmd_type'] = type;
                res['id'] = cmd_addr;

                if (parent_cmd) {
                    if (!parent_cmd.hasOwnProperty('childs'))
                        parent_cmd['childs'] = [];

                    parent_cmd.childs.push(res);
                }

                // try to find decomposition
                self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F,
                    [
                        sc_type_node | sc_type_const,
                        sc_type_arc_common | sc_type_const,
                        cmd_addr,
                        sc_type_arc_pos_const_perm,
                        window.scKeynodes.nrel_ui_commands_decomposition
                    ])
                    .done(function (it1) {
                        // iterate child commands
                        self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                            [
                                it1[0][0],
                                sc_type_arc_pos_const_perm,
                                0
                            ])
                            .done(function (it2) {
                                var childsDef = [];
                                for (idx in it2) {
                                    childsDef.push(parseCommand(it2[idx][2], res));
                                }

                                $.when.apply($, childsDef)
                                    .done(function () {
                                        dfd.resolve(res);
                                    });
                            })
                            .fail(function () {
                                dfd.resolve(res);
                            });
                    })
                    .fail(function () {
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
ScHelper.prototype.getLanguages = function () {
    return scHelper.getSetElements(window.scKeynodes.languages);
};

/*! Function to get list of available output languages
 * @returns Returns promise objects, that resolved with a list of available output languages. If 
 * failed, then promise rejects
 */
ScHelper.prototype.getOutputLanguages = function () {
    return scHelper.getSetElements(window.scKeynodes.ui_external_languages);
};

/*! Function to find answer for a specified question
 * @param question_addr sc-addr of question to get answer
 * @returns Returns promise object, that resolves with sc-addr of found answer structure.
 * If function fails, then promise rejects
 */
ScHelper.prototype.getAnswer = function (question_addr) {
    var dfd = new jQuery.Deferred();

    (function (_question_addr, _self, _dfd) {
        var fn = this;

        this.timer = window.setTimeout(function () {
            _dfd.reject();

            window.clearTimeout(fn.timer);
            delete fn.timer;

            if (fn.event_id) {
                _self.sctp_client.event_destroy(fn.event_id);
                delete fn.event_id;
            }
        }, 10000);

        _self.sctp_client.event_create(SctpEventType.SC_EVENT_ADD_OUTPUT_ARC, _question_addr, function (addr, arg) {
            _self.checkEdge(window.scKeynodes.nrel_answer, sc_type_arc_pos_const_perm, arg).done(function () {
                _self.sctp_client.get_arc(arg).done(function (res) {
                    _dfd.resolve(res[1]);
                }).fail(function () {
                    _dfd.reject();
                });
            });
        }).done(function (res) {
            fn.event_id = res;
            _self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [
                    _question_addr,
                    sc_type_arc_common | sc_type_const,
                    sc_type_node, /// @todo possible need node struct
                    sc_type_arc_pos_const_perm,
                    window.scKeynodes.nrel_answer
                ])
                .done(function (it) {
                    _self.sctp_client.event_destroy(fn.event_id).fail(function () {
                        /// @todo process fail
                    });
                    _dfd.resolve(it[0][2]);

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
ScHelper.prototype.getSystemIdentifier = function (addr) {
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
            self.sctp_client.get_link_content(it[0][2])
                .done(function (res) {
                    dfd.resolve(res);
                })
                .fail(function () {
                    dfd.reject();
                });
        })
        .fail(function () {
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
ScHelper.prototype.getIdentifier = function (addr, lang) {
    var dfd = new jQuery.Deferred();
    var self = this;

    var get_sys = function () {
        self.getSystemIdentifier(addr)
            .done(function (res) {
                dfd.resolve(res);
            })
            .fail(function () {
                dfd.reject();
            });
    };

    window.sctpClient.iterate_constr(
        SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
            [addr,
                sc_type_arc_common | sc_type_const,
                sc_type_link,
                sc_type_arc_pos_const_perm,
                window.scKeynodes.nrel_main_idtf
            ],
            {"x": 2}),
        SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
            [lang,
                sc_type_arc_pos_const_perm,
                "x"
            ])
    ).done(function (results) {
        var link_addr = results.get(0, "x");

        self.sctp_client.get_link_content(link_addr)
            .done(function (res) {
                dfd.resolve(res);
            })
            .fail(function () {
                dfd.reject();
            });
    }).fail(function () {
        get_sys();
    });

    return dfd.promise();
};