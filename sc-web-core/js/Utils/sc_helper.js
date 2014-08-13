ScHelper = function(sctp_client) {
    this.sctp_client = sctp_client;
};

ScHelper.prototype.init = function() {
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
ScHelper.prototype.checkEdge = function(addr1, type, addr2 ) {
    var dfd = new jQuery.Deferred();
    
    this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F, 
                                      [
                                          addr1,
                                          type,
                                          addr2
                                      ]).done(function() {
        dfd.resolve();
    }).fail(function() {
        dfd.reject();
    });
    
    return dfd.promise();
};

/*! Function to get elements of specified set
 * @param addr {String} sc-addr of set to get elements
 * @returns Returns promise objects, that resolved with a list of set elements. If 
 * failed, that promise object rejects
 */
ScHelper.prototype.getSetElements = function(addr) {
    var dfd = new jQuery.Deferred();
    
    this.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                      [
                                          addr,
                                          sc_type_arc_pos_const_perm,
                                          sc_type_node | sc_type_const
                                      ])
    .done(function (res) {
        var langs = [];
        
        for (r in res.result) {
            langs.push(res.result[r][2]);
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
ScHelper.prototype.getMainMenuCommands = function() {
    
    var self = this;
    
    function determineType(cmd_addr) {
        var dfd = new jQuery.Deferred();
        scHelper.checkEdge(
            scKeynodes.ui_user_command_class_atom,
            sc_type_arc_pos_const_perm,
            cmd_addr)
        .done(function() {
            dfd.resolve('cmd_atom');    
        })
        .fail(function() {
            scHelper.checkEdge(
                scKeynodes.ui_user_command_class_noatom,
                sc_type_arc_pos_const_perm,
                cmd_addr)
            .done(function() {
                dfd.resolve('cmd_noatom');
            })
            .fail(function() {
                dfd.resolve('unknown');
            });
        });
        
        return dfd.promise();
    }
    
    function parseCommand(cmd_addr, parent_cmd) {
        var dfd = new jQuery.Deferred();
        
        // determine command type
        determineType(cmd_addr)
            .done(function(type) {
                var res = {};
                res['cmd_type'] = type;
                res['id'] = cmd_addr;
                
                if (parent_cmd) {
                    if (!parent_cmd.hasOwnProperty('childs'))
                        parent_cmd['childs'] = [];

                    parent_cmd.childs.push(res);
                }
                
                // try to find decomposition
                self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                                  [
                                                      sc_type_node | sc_type_const,
                                                      sc_type_arc_common | sc_type_const,
                                                      cmd_addr,
                                                      sc_type_arc_pos_const_perm,
                                                      scKeynodes.nrel_ui_commands_decomposition
                                                  ])
                .done(function(it1) {
                    // iterate child commands
                    self.sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                                      [
                                                          it1.result[0][0],
                                                          sc_type_arc_pos_const_perm,
                                                          0
                                                      ])
                    .done(function(it2) {
                        var childsDef = [];
                        for (idx in it2.result) {
                            childsDef.push(parseCommand(it2.result[idx][2], res));
                        }
                        
                        $.when.apply($, childsDef)
                            .done(function() {
                                dfd.resolve(res);
                            });
                    })
                    .fail(function() {
                        dfd.resolve(res);
                    });
                })
                .fail(function() {
                    dfd.resolve(res);
                });
                
            });
        
        return dfd.promise();
    }
    
    
    return parseCommand(scKeynodes.ui_main_menu, null);
};

/*! Function to get available native user languages
 * @returns Returns promise object. It will be resolved with one argument - list of 
 * available user native languages. If funtion failed, then promise object rejects.
 */
ScHelper.prototype.getLanguages = function() {
    return scHelper.getSetElements(scKeynodes.languages);
};

/*! Function to get list of available output languages
 * @returns Returns promise objects, that resolved with a list of available output languages. If 
 * failed, that promise object rejects
 */
ScHelper.prototype.getOutputLanguages = function() {
    return scHelper.getSetElements(scKeynodes.ui_external_languages);
};

/*!
 */