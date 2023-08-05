let ScHelper = function (scClient) {
  this.scClient = scClient;
};

ScHelper.prototype.init = function () {
  return Promise.resolve();
};

ScHelper.prototype.getConnectorElements = async function (arc) {
  let scTemplate = new sc.ScTemplate();
  scTemplate.triple(
      [sc.ScType.Unknown, "_source"],
      arc,
      [sc.ScType.Unknown, "_target"]
  );
  const result = await scClient.templateSearch(scTemplate);
  return [result[0].get("_source"), result[0].get("_target")];
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
  template.triple(addr1, type, addr2);
  let result = await this.scClient.templateSearch(template);
  return result.length !== 0;
};

/*! Function to get elements of specified set
 * @param addr {String} sc-addr of set to get elements
 * @returns Returns promise objects, that resolved with a list of set elements. If 
 * failed, that promise object rejects
 */
ScHelper.prototype.getSetElements = async function (addr) {
  let template = new sc.ScTemplate();
  addr = new sc.ScAddr(addr);
  template.triple(addr, sc.ScType.EdgeAccessVarPosPerm, sc.ScType.NodeVar);
  let result = await this.scClient.templateSearch(template);
  return result.map(x => x.get(2).value);
};

ScHelper.prototype.getStructureElementsByRelation = async function (structure, relation) {
  let template = new sc.ScTemplate();
  template.tripleWithRelation(
    structure,
    [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
    [sc.ScType.Unknown, "_main_node"],
    sc.ScType.EdgeAccessVarPosPerm,
    relation,
  );

  const result = await window.scClient.templateSearch(template);
  return result.map((triple) => {
    return {connectorFromStructure: triple.get("_edge_from_scene"), structureElement: triple.get("_main_node")};
  });
};

ScHelper.prototype.getStructureMainKeyElements = async function (structure) {
  return await this.getStructureElementsByRelation(structure, new sc.ScAddr(window.scKeynodes['rrel_main_key_sc_element']));
};

ScHelper.prototype.getStructureKeyElements = async function (structure) {
  return await this.getStructureElementsByRelation(structure, new sc.ScAddr(window.scKeynodes['rrel_key_sc_element']));
};

/*! Function resolve commands hierarchy for main menu.
 * It returns main menu command object, that contains whole hierarchy as a child objects
 */
ScHelper.prototype.getMainMenuCommands = async function () {
  const self = this;

  async function determineType(cmd_addr) {
    let isAtom = await self.checkEdge(
      window.scKeynodes["ui_user_command_class_atom"], sc.ScType.EdgeAccessConstPosPerm, cmd_addr);
    if (isAtom) return "cmd_atom";
    let isNoAtom = await self.checkEdge(
      window.scKeynodes["ui_user_command_class_noatom"], sc.ScType.EdgeAccessConstPosPerm, cmd_addr);
    if (isNoAtom) return "cmd_noatom";
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
    decompositionTemplate.tripleWithRelation(
      [sc.ScType.NodeVar, 'decomposition'],
      sc.ScType.EdgeDCommonVar,
      new sc.ScAddr(cmd_addr),
      sc.ScType.EdgeAccessVarPosPerm,
      new sc.ScAddr(window.scKeynodes["nrel_ui_commands_decomposition"]));
    decompositionTemplate.triple(
      'decomposition',
      sc.ScType.EdgeAccessVarPosPerm,
      [sc.ScType.NodeVar, 'child_addr']
    );
    let decompositionResult = await self.scClient.templateSearch(decompositionTemplate);
    await Promise.all(decompositionResult.map(x => parseCommand(x.get('child_addr').value, res)));
    return res;
  }

  return parseCommand(window.scKeynodes["ui_main_menu"], null);
};

/*! Function to get available native user languages
 * @returns Returns promise object. It will be resolved with one argument - list of 
 * available user native languages. If function failed, then promise object rejects.
 */
ScHelper.prototype.getLanguages = function () {
  return window.scHelper.getSetElements(window.scKeynodes['languages']);
};

/*! Function to get list of available output languages
 * @returns Returns promise objects, that resolved with a list of available output languages. If 
 * failed, then promise rejects
 */
ScHelper.prototype.getOutputLanguages = function () {
  return window.scHelper.getSetElements(window.scKeynodes['ui_external_languages']);
};

/*! Function to find answer for a specified question
 * @param question_addr sc-addr of question to get answer
 * @returns Returns promise object, that resolves with sc-addr of found answer structure.
 * If function fails, then promise rejects
 */
ScHelper.prototype.getAnswer = function (question_addr) {
  return new Promise(async (resolve) => {
    let template = new sc.ScTemplate();
    let timer = setTimeout(async () => {
      reject();
      clearTimeout(timer);
      resolve(null);
    }, 10_000);
    template.tripleWithRelation(
      new sc.ScAddr(parseInt(question_addr)),
      sc.ScType.EdgeDCommonVar,
      [sc.ScType.NodeVar, "_answer"],
      sc.ScType.EdgeAccessVarPosPerm,
      new sc.ScAddr(window.scKeynodes['nrel_answer']),
    );
    let templateSearch = [];
    while (!templateSearch.length && timer) {
      templateSearch = await this.scClient.templateSearch(template);
      if (templateSearch.length) {
        resolve(templateSearch[0].get("_answer").value);
        clearTimeout(timer);
        break;
      }
    }
  });
};

ScHelper.prototype.setLinkFormat = async function (addr, format) {
  const EDGE = "edge";

  let template = new sc.ScTemplate();
  template.tripleWithRelation(
    new sc.ScAddr(addr),
    [sc.ScType.EdgeDCommonVar, EDGE],
    sc.ScType.NodeVar,
    sc.ScType.EdgeAccessVarPosPerm,
    new sc.ScAddr(window.scKeynodes['nrel_format']),
  );
  const result = await scClient.templateSearch(template);
  if (result.length) {
    await scClient.deleteElements([result[0].get(EDGE)]);
  }

  template = new sc.ScTemplate();
  template.tripleWithRelation(
      new sc.ScAddr(addr),
      [sc.ScType.EdgeDCommonVar, EDGE],
      new sc.ScAddr(format),
      sc.ScType.EdgeAccessVarPosPerm,
      new sc.ScAddr(window.scKeynodes['nrel_format']),
  );
  await scClient.templateGenerate(template);
};

ScHelper.prototype.searchNodeByIdentifier = async (linkAddr, identification) => {
    const NODE = "_node";

    const template = new sc.ScTemplate();
    template.triple(
        [sc.ScType.Unknown, NODE],
        sc.ScType.EdgeDCommonVar,
        linkAddr,
        sc.ScType.EdgeAccessVarPosPerm,
        identification,
    );
    let result = await window.scClient.templateSearch(template);
    if (result.length) {
        return result[0].get(NODE);
    }

    return null;
};
