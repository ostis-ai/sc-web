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
  return new Promise(async (resolve, reject) => {
    let event;
    let timer = setTimeout(async () => {
      reject();
      clearTimeout(timer);
      timer = null;
      if (event) {
        this.sctp_client.EventsDestroy(event);
        event = null;
      }
    }, 10_000);
    let eventRequest = new sc.ScEventParams(
      new sc.ScAddr(Number.parseInt(question_addr)),
      sc.ScEventType.AddOutgoingEdge,
      async (elAddr, edge, otherAddr) => {
        let isAnswer = await this.checkEdge(scKeynodes.nrel_answer, sc.ScType.EdgeAccessVarPosPerm, edge);
        if(isAnswer) {
          resolve(otherAddr);
        }
      });
    event = (await this.sctp_client.EventsCreate([eventRequest]))[0];
    let scTemplate = new sc.ScTemplate();
    scTemplate.TripleWithRelation(
      new sc.ScAddr(Number.parseInt(question_addr)),
      sc.ScType.EdgeDCommonVar,
      [sc.ScType.NodeVar, "answer"],
      sc.ScType.EdgeAccessVarPosPerm,
      new sc.ScAddr(scKeynodes.nrel_answer)
    );
    let templateSearch = await this.sctp_client.TemplateSearch(scTemplate);
    if (templateSearch.length) {
      resolve(templateSearch[0].Get("answer").value);
      this.sctp_client.EventsDestroy([event]);
      clearTimeout(timer);
    }
  });
};

ScHelper.prototype.setLinkFormat = async function (addr, format) {
  let scTemplate = new sc.ScTemplate();
  scTemplate.TripleWithRelation(
    new sc.ScAddr(addr),
    sc.ScType.EdgeDCommonVar,
    new sc.ScAddr(format),
    sc.ScType.EdgeAccessVarPosPerm,
    new sc.ScAddr(scKeynodes.nrel_format)
  );
  await sctpClient.TemplateGenerate(scTemplate);
};
