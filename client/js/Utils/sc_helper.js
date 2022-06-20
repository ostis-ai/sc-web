ScHelper = function (sctp_client) {
  this.sctp_client = sctp_client;
};

ScHelper.prototype.init = function () {
  return Promise.resolve();
};

/*! Check if there are specified arc between two objects
 * @param {String} addr1 sc-addr of source sc-element
 * @param {int} type type of sc-edge, that need to be checked for existing
 * @param {String} addr2 sc-addr of target sc-element
 * @returns Function returns Promise object. If sc-edge exists, then it would be resolved; 
 * otherwise it would be rejected
 */
ScHelper.prototype.checkEdge = async function (addr1, type, addr2) {
  let template = new sc.ScTemplate();
  addr1 = new sc.ScAddr(addr1);
  type = new sc.ScType(type).changeConst(false);
  addr2 = new sc.ScAddr(addr2);
  template.Triple(addr1, type, addr2);
  let result = await this.sctp_client.TemplateSearch(template);
  return result.length !== 0
};

/*! Function to get elements of specified set
 * @param addr {String} sc-addr of set to get elements
 * @returns Returns promise objects, that resolved with a list of set elements. If 
 * failed, that promise object rejects
 */
ScHelper.prototype.getSetElements = async function (addr) {
  let template = new sc.ScTemplate();
  addr = new sc.ScAddr(addr);
  template.Triple(addr, sc.ScType.EdgeAccessVarPosPerm, sc.ScType.NodeVar);
  let result = await this.sctp_client.TemplateSearch(template);
  return result.map(x => x.Get(2).value);
};

/*! Function resolve commands hierarchy for main menu.
 * It returns main menu command object, that contains whole hierarchy as a child objects
 */
ScHelper.prototype.getMainMenuCommands = async function () {

  var self = this;

  async function determineType(cmd_addr) {
    let isAtom = await self.checkEdge(window.scKeynodes.ui_user_command_class_atom, sc.ScType.EdgeAccessConstPosPerm, cmd_addr);
    if(isAtom) return "cmd_atom";
    let isNoAtom = await self.checkEdge(window.scKeynodes.ui_user_command_class_noatom, sc.ScType.EdgeAccessConstPosPerm, cmd_addr);
    if(isNoAtom) return "cmd_noatom";
    return 'unknown';
  }

  async function parseCommand(cmd_addr, parent_cmd) {
    let type = await determineType(cmd_addr);
    let res = {
      cmd_type: type,
      id: cmd_addr
    }
    if (parent_cmd) {
      if (!parent_cmd.hasOwnProperty('childs')) {
        parent_cmd['childs'] = [];
      }
      parent_cmd.childs.push(res);
    }


    let decompositionTemplate = new sc.ScTemplate();
    decompositionTemplate.TripleWithRelation(
      [sc.ScType.NodeVar, 'decomposition'],
      sc.ScType.EdgeDCommonVar,
      new sc.ScAddr(cmd_addr),
      sc.ScType.EdgeAccessVarPosPerm,
      new sc.ScAddr(scKeynodes.nrel_ui_commands_decomposition));
    decompositionTemplate.Triple(
      'decomposition',
      sc.ScType.EdgeAccessVarPosPerm,
      [sc.ScType.NodeVar, 'child_addr']
    );
    let decompositionResult = await self.sctp_client.TemplateSearch(decompositionTemplate);
    await Promise.all(decompositionResult.map(x => parseCommand(x.Get('child_addr').value, res)));
    return res;
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

ScHelper.prototype.setLinkFormat = function (addr, format) {
  var self = this;
  window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, addr, format).done(function (arc_addr) {
    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_format, arc_addr).fail(function () {
      console.log("Fail in ScHelper.prototype.setLinkFormat create_arc(nrel_format, arc_addr)")
    });
  }).fail(function () {
    console.log("Fail in SScHelper.prototype.setLinkFormat create_arc(addr, format)")
  });
};
