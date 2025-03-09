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
  const result = await scClient.searchByTemplate(scTemplate);
  return [result[0].get("_source"), result[0].get("_target")];
};

/*! Check if there is specified connector between two objects
 * @param {String} addr1 sc-addr of source sc-element
 * @param {int} type type of sc-connector, that need to be checked for existing
 * @param {String} addr2 sc-addr of target sc-element
 * @returns Function returns Promise object. If sc-connector exists, then it would be resolved; 
 * otherwise it would be rejected
 * @note This method can be used if you want to search for constructions with constant sc-connectors only
 */
ScHelper.prototype.checkConnector = async function (addr1, type, addr2) {
  let template = new sc.ScTemplate();
  addr1 = new sc.ScAddr(addr1);
  type = new sc.ScType(type).changeConst(false);
  addr2 = new sc.ScAddr(addr2);
  template.triple(addr1, type, addr2);
  let result = await this.scClient.searchByTemplate(template);
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
  template.triple(addr, sc.ScType.VarPermPosArc, sc.ScType.VarNode);
  let result = await this.scClient.searchByTemplate(template);
  return result.map(x => x.get(2).value);
};

ScHelper.prototype.getStructureElementsByRelation = async function (structure, relation) {
  let template = new sc.ScTemplate();
  template.quintuple(
    structure,
    [sc.ScType.VarPermPosArc, "_connector_from_scene"],
    [sc.ScType.Unknown, "_main_node"],
    sc.ScType.VarPermPosArc,
    relation,
  );

  const result = await window.scClient.searchByTemplate(template);
  return result.map((triple) => {
    return {connectorFromStructure: triple.get("_connector_from_scene"), structureElement: triple.get("_main_node")};
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
    let isAtom = await self.checkConnector(
      window.scKeynodes["ui_user_command_class_atom"], sc.ScType.ConstPermPosArc, cmd_addr);
    if (isAtom) return "cmd_atom";
    let isNoAtom = await self.checkConnector(
      window.scKeynodes["ui_user_command_class_noatom"], sc.ScType.ConstPermPosArc, cmd_addr);
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
    decompositionTemplate.quintuple(
      [sc.ScType.VarNode, 'decomposition'],
      sc.ScType.VarCommonArc,
      new sc.ScAddr(cmd_addr),
      sc.ScType.VarPermPosArc,
      new sc.ScAddr(window.scKeynodes["nrel_ui_commands_decomposition"]));
    decompositionTemplate.triple(
      'decomposition',
      sc.ScType.VarPermPosArc,
      [sc.ScType.VarNode, 'child_addr']
    );
    let decompositionResult = await self.scClient.searchByTemplate(decompositionTemplate);
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

/*! Function to find result for a specified action
 * @param action_addr sc-addr of action to get result
 * @returns Returns promise object, that resolves with sc-addr of found result structure.
 * If function fails, then promise rejects
 */
ScHelper.prototype.getResult = function (action_addr) {
  return new Promise(async (resolve) => {
    let template = new sc.ScTemplate();
    let timer = setTimeout(async () => {
      reject();
      clearTimeout(timer);
      resolve(null);
    }, 10_000);
    template.quintuple(
      new sc.ScAddr(parseInt(action_addr)),
      sc.ScType.VarCommonArc,
      [sc.ScType.VarNode, "_result"],
      sc.ScType.VarPermPosArc,
      new sc.ScAddr(window.scKeynodes['nrel_result']),
    );
    let searchByTemplate = [];
    while (!searchByTemplate.length && timer) {
      searchByTemplate = await this.scClient.searchByTemplate(template);
      if (searchByTemplate.length) {
        resolve(searchByTemplate[0].get("_result").value);
        clearTimeout(timer);
        break;
      }
    }
  });
};

ScHelper.prototype.setLinkFormat = async function (addr, format) {
  const CONNECTOR = "connector";

  let template = new sc.ScTemplate();
  template.quintuple(
    new sc.ScAddr(addr),
    [sc.ScType.VarCommonArc, CONNECTOR],
    sc.ScType.VarNode,
    sc.ScType.VarPermPosArc,
    new sc.ScAddr(window.scKeynodes['nrel_format']),
  );
  const result = await scClient.searchByTemplate(template);
  if (result.length) {
    await scClient.eraseElements([result[0].get(CONNECTOR)]);
  }

  template = new sc.ScTemplate();
  template.quintuple(
      new sc.ScAddr(addr),
      [sc.ScType.VarCommonArc, CONNECTOR],
      new sc.ScAddr(format),
      sc.ScType.VarPermPosArc,
      new sc.ScAddr(window.scKeynodes['nrel_format']),
  );
  await scClient.generateByTemplate(template);
};

ScHelper.prototype.searchNodeByIdentifier = async (linkAddr, identification) => {
    const NODE = "_node";

    const template = new sc.ScTemplate();
    template.triple(
        [sc.ScType.Unknown, NODE],
        sc.ScType.VarCommonArc,
        linkAddr,
        sc.ScType.VarPermPosArc,
        identification,
    );
    let result = await window.scClient.searchByTemplate(template);
    if (result.length) {
        return result[0].get(NODE);
    }

    return null;
};
