SCWeb.core.scAddrsDict = {};

SCWeb.core.CommandState = function (command_addr, command_args, format, lang) {
    this.command_addr = command_addr;
    this.command_args = command_args || [];
    this.format = format;
    this.lang = lang
}

/**
 * Create new instance of component sandbox.
 * @param options
 */
SCWeb.core.ComponentSandbox = function (options) {

    this.command_state = options.command_state;
    this.container = options.container;
    this.container_selector = "#" + SCWeb.ui.Core.selectorWindowScAddr(options.window_id);
    this.wrap_selector = '#' + this.container + '_wrap';
    this.addr = parseInt(options.addr);
    this.is_struct = options.is_struct;
    this.format_addr = options.format_addr;
    this.is_editor = options.canEdit;

    this.eventGetObjectsToTranslate = null;
    this.eventApplyTranslation = null;
    this.eventArgumentsUpdate = null;
    this.eventWindowActiveChanged = null;
    this.eventDataAppend = null;

    /* function (added, element, arc)
     * - added - true, when element added; false - element removed
     * - element - sc-addr of added(removed) sc-element
     * - arc - sc-addr of arc that connect struct with element
     */
    this.eventStructUpdate = null;

    this.event_add_element = null;
    this.event_remove_element = null;

    this.listeners = [];
    this.keynodes = options.keynodes;

    var self = this;
    this.listeners = [];
    this.childs = {};

    this.createWindowControls();

    // listen arguments
    this.listeners.push(SCWeb.core.EventManager.subscribe("arguments/add", this, this.onArgumentAppended));
    this.listeners.push(SCWeb.core.EventManager.subscribe("arguments/remove", this, this.onArgumentRemoved));
    this.listeners.push(SCWeb.core.EventManager.subscribe("arguments/clear", this, this.onArgumentCleared));

    // listen translation
    this.listeners.push(SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation));
    this.listeners.push(SCWeb.core.EventManager.subscribe("translation/get", this, function (objects) {
        var items = self.getObjectsToTranslate();
        for (var i in items) {
            objects.push(items[i]);
        }
    }));

    // listen struct changes
    /// @todo possible need to wait event creation
    if (this.is_struct) {
        let addArcEventRequest = new sc.ScEventParams(
            new sc.ScAddr(this.addr),
            sc.ScEventType.AddOutgoingEdge,
            (elAddr, edge, otherAddr) => {
                if (self.eventStructUpdate) {
                    self.eventStructUpdate(true, elAddr.value, edge.value);
                }
            });
        let removeArcEventRequest = new sc.ScEventParams(
            new sc.ScAddr(this.addr),
            sc.ScEventType.RemoveOutgoingEdge,
            (elAddr, edge, otherAddr) => {
                if (self.eventStructUpdate) {
                    self.eventStructUpdate(false, elAddr.value, edge.value);
                }
            });
        window.scClient.eventsCreate([addArcEventRequest, removeArcEventRequest])
            .then((addArcEvent, removeArcEvent) => {
                self.event_add_element = addArcEvent;
                self.event_remove_element = removeArcEvent;
            });
    }
};

SCWeb.core.ComponentSandbox.prototype = {
    constructor: SCWeb.core.ComponentSandbox
};

// ------------------ Core functions --------------------------
/**
 * Destroys component sandbox
 */
SCWeb.core.ComponentSandbox.prototype.destroy = function () {
    for (let l in this.listeners) {
        SCWeb.core.EventManager.unsubscribe(this.listeners[l]);
    }

    /// @todo possible need to wait event destroy
    let events = [];
    if (this.event_add_element)
        events.push(this.event_add_element);
    if (this.event_remove_element)
        events.push(this.event_remove_element);
    window.scClient.eventsDestroy(events);
};

/**
 * Create controls for window
 */
SCWeb.core.ComponentSandbox.prototype.createWindowControls = function () {
    /*var html = '<button type="button" class="button-menu btn btn-default btn-xs" data-toggle="button"><span class="caret"></span></button>\
     <div class="btn-group-vertical btn-group-xs hidden"> \
     <button type="button" class="btn btn-success"><span class="glyphicon glyphicon-tags"></span></button> \
     </div>';
     var self = this;
     var controls = $(this.wrap_selector + ' > .sc-content-controls');
     controls.append(html).find('.button-menu').on('click', function() {
     controls.find('.btn-group-vertical').toggleClass('hidden');
     });*/

};

// ------------------ Functions to call from component --------

SCWeb.core.ComponentSandbox.prototype.canEdit = function () {
    return this.is_editor;
};

SCWeb.core.ComponentSandbox.prototype.getCurrentLanguage = function () {
    return SCWeb.core.Translation.getCurrentLanguage();
};

SCWeb.core.ComponentSandbox.prototype.getLanguages = function () {
    return SCWeb.core.Translation.getLanguages();
};

/*!
 * @param {Array} args Array of sc-addrs of commnad arguments.
 */
SCWeb.core.ComponentSandbox.prototype.doDefaultCommand = function (args) {
    SCWeb.core.Main.doDefaultCommand(args);
};

/*! Resolves sc-addr for all elements with attribute sc_control_sys_idtf
 */
SCWeb.core.ComponentSandbox.prototype.resolveElementsAddr = function (parentSelector) {
    SCWeb.ui.Core.resolveElementsAddr(parentSelector);
};

/*!
 * Genarate html for new window container
 * @param {String} containerId ID that will be set to container
 * @param {String} classes Classes that will be added to container
 * @param {String} addr sc-addr of window
 */
SCWeb.core.ComponentSandbox.prototype.generateWindowContainer = function (containerId, containerClasses, controlClasses, addr) {

    return SCWeb.ui.WindowManager.generateWindowContainer(containerId, containerClasses, controlClasses, addr);
};

/*! Returns keynode by it system identifier
 * @param {String} sys_idtf System identifier
 * @returns If keynodes exist, then returns it sc-addr; otherwise returns null
 */
SCWeb.core.ComponentSandbox.prototype.getKeynode = function (sys_idtf) {
    var res = this.keynodes[sys_idtf];
    if (res) {
        return res;
    }
    return null;
};

SCWeb.core.ComponentSandbox.prototype.getIdentifiers = function (addr_list, callback) {
    SCWeb.core.Server.resolveIdentifiers(addr_list).then(callback);
};

SCWeb.core.ComponentSandbox.prototype.getIdentifier = function (addr, callback) {
    SCWeb.core.Server.resolveIdentifiers([addr]).then(function (idtfs) {
        callback(idtfs[addr]);
    });
};

SCWeb.core.ComponentSandbox.prototype.resolveAddrs = function (idtf_list, callback) {

    var arguments = [];
    var result = {};
    for (idx in idtf_list) {
        var idtf = idtf_list[idx];
        var addr = SCWeb.core.scAddrsDict[idtf];
        if (addr)
            result[idtf] = addr;
        else
            arguments.push(idtf);
    }

    SCWeb.core.Server.resolveScAddr(arguments).then(function (data) {

        for (var key in data) {
            if (data.hasOwnProperty(key))
                SCWeb.core.scAddrsDict[key] = data[key];
        }
        callback(SCWeb.core.scAddrsDict);
    });
};

SCWeb.core.ComponentSandbox.prototype._appendChilds = function (windows) {
    for (cntId in windows) {
        if (!windows.hasOwnProperty(cntId))
            continue;
        if (this.childs[cntId])
            console.warn("Duplicate child container " + cntId);
        this.childs[cntId] = windows[cntId];
    }
};

SCWeb.core.ComponentSandbox.prototype.removeChild = function removeChild() {
    this.childs = {};
};

SCWeb.core.ComponentSandbox.prototype.updateAnswer = function () {
    var performAnswer = jQuery.proxy(function (answer_addr) {
        this.addr = answer_addr;
        this.removeChild();
    }, this);
    return SCWeb.core.Main.getTranslatedAnswer(this.command_state)
        .then(performAnswer);
}


/**
 * Create viewers for specified sc-links
 * @param {Object} containers_map Map of viewer containers (key: sc-link addr, value: id of container)
 */
SCWeb.core.ComponentSandbox.prototype.createViewersForScLinks = async function (containers_map) {
    return new Promise((resolve, reject) => {
        var self = this;
        SCWeb.ui.WindowManager.createViewersForScLinks(containers_map).then(function (windows) {
            self._appendChilds(windows);
            resolve(windows);
        }).catch(reject);
    })
};

/**
 * Create viewers for specified sc-structures
 * @param {Object} containers_map Map of viewer containers (id: id of container, value: {key: sc-struct addr, ext_lang_addr: sc-addr of external language}})
 */
SCWeb.core.ComponentSandbox.prototype.createViewersForScStructs = function (containers_map) {
    var windows = SCWeb.ui.WindowManager.createViewersForScStructs(containers_map);
    this._appendChilds(windows);
    return windows;
};

/*! Function takes content of sc-link or sctructure from server and call event handlers
 * {String} contentType type of content data (@see scClient.getLinkContent). If it's null, then
 * data will be returned as string
 */
SCWeb.core.ComponentSandbox.prototype.updateContent = async function (contentType) {
    var self = this;

    if (this.is_struct && this.eventStructUpdate) {
        const maxNumberOfTriplets = 850;

        const levelScales = [{ node: 2.3, link: 1.8, opacity: 1 }, { node: 1.8, link: 1.5, opacity: 1 }, { node: 1.4, link: 1, opacity: 1 }, { node: 1, link: 1, opacity: 1 }, { node: 1, link: 1, opacity: 0.8 }, { node: 1, link: 1, opacity: 0.6 }, { node: 1, link: 1, opacity: 0.4 }];

        let scTemplateMainlevel = new sc.ScTemplate();
        scTemplateMainlevel.tripleWithRelation(
        // ! TODO: не забыть удалить из client/js/Utils/sc_keynodes.js ноды которые я вставлял для теста в самом конце!!
            [new sc.ScAddr(window.scKeynodes['section_core_and_extensions_sc_models_core_kb']), "src"],//тут у нас должен быть [new sc.ScAddr(this.addr), "src"] 
            [sc.ScType.EdgeAccessVarPosPerm, "edge"],
            [sc.ScType.Unknown, "mainNode"],
            sc.ScType.EdgeAccessVarPosPerm,
            new sc.ScAddr(window.scKeynodes['rrel_key_sc_element']),
        );
        let resultLevel = await window.scClient.templateSearch(scTemplateMainlevel);

        let mainElements = [];
        for (let triple of resultLevel) {
            mainElements.push(triple.get('mainNode').value)
            self.eventStructUpdate(true, triple.get('src').value, triple.get('edge').value, levelScales[0]);
        };

        let searchAllLevelEdges = async function (elementsArr, levelScales, level, visitedElements) {
            let levelScale;

            level > 6 ? levelScale = { node: 1, link: 1, opacity: 0.4  } : levelScale = levelScales[level];

            for (let i = 0; i < elementsArr.length; i++) {

                let elements = elementsArr[i];
                let newElementsArr = [];
                for (let j = 0; j < elements.length; j++) {
                    let elem = elements[j];
                    let newElements = await searchLevelEdges(elem, levelScale, visitedElements);
                    newElementsArr.push(newElements);
                }
                await searchAllLevelEdges(newElementsArr, levelScales, level + 1, visitedElements);
            }
        };

        let searchLevelEdges = async function (mainElem, scale, visitedElements) {
            let incomingLevelNodesWithRelation = await searchLevelEdgesByDirection(mainElem, scale, visitedElements, true, true);
            let incomingLevelNodesNotWithRelation = await searchLevelEdgesByDirection(mainElem, scale, visitedElements, true, false);
            let outgoingLevelNodesWithRelation = await searchLevelEdgesByDirection(mainElem, scale, visitedElements, false, true);
            let outgoingLevelNodesNotWithRelation = await searchLevelEdgesByDirection(mainElem, scale, visitedElements, false, false);
            return [...incomingLevelNodesWithRelation, ...incomingLevelNodesNotWithRelation, ...outgoingLevelNodesWithRelation, ...outgoingLevelNodesNotWithRelation];
        };

        let searchLevelEdgesByDirection = async function (mainElem, scale, visitedElements, incomingEdge, withRelation) {
            let levelNodes = [];

            let scTemplate = new sc.ScTemplate();
            scTemplate.triple(
                [new sc.ScAddr(window.scKeynodes['section_core_and_extensions_sc_models_core_kb']), "src"],
                [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToMainEdge"],
                [sc.ScType.Unknown, "edgeFromMainNodeToSecondNode"],
            );
            if (incomingEdge) {
                scTemplate.triple(
                    [sc.ScType.Unknown, "nodeSecond"],
                    "edgeFromMainNodeToSecondNode",
                    new sc.ScAddr(mainElem),
                );
            };
            if (!incomingEdge) {
                scTemplate.triple(
                    new sc.ScAddr(mainElem),
                    "edgeFromMainNodeToSecondNode",
                    [sc.ScType.Unknown, "nodeSecond"],
                );
            };
            scTemplate.triple(
                "src",
                [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToSecondNode"],
                "nodeSecond",
            );

            if (withRelation) {
                scTemplate.triple(
                    [sc.ScType.Unknown, "relationNode"],
                    [sc.ScType.EdgeAccessVarPosPerm, "edgeFromRelationNodeToEdgeFromMainNodeToSecondNode"],
                    "edgeFromMainNodeToSecondNode",
                );
                scTemplate.triple(
                    "src",
                    [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToRelationNode"],
                    "relationNode",
                );
                scTemplate.triple(
                    "src",
                    [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToEdgeFromRelationNodeToEdgeFromMainNodeToSecondNode"],
                    "edgeFromRelationNodeToEdgeFromMainNodeToSecondNode",
                );
            };

            let result = await window.scClient.templateSearch(scTemplate);
            for (let triple of result) {
                let nodeSecond = triple.get("nodeSecond").value;
                if (!visitedElements.includes(nodeSecond) && !levelNodes.includes(nodeSecond)) {
                    levelNodes.push(nodeSecond);
                    visitedElements.push(nodeSecond);
                };

                self.eventStructUpdate(true, triple.get("src").value, triple.get("edgeFromContourToSecondNode").value, scale);
                self.eventStructUpdate(true, triple.get("src").value, triple.get("edgeFromContourToMainEdge").value, scale);
                if (withRelation) {
                    let relationNode = triple.get("relationNode").value;
                    if (!visitedElements.includes(relationNode) && !levelNodes.includes(relationNode)) {
                        levelNodes.push(relationNode);
                        visitedElements.push(relationNode);
                    }
                    self.eventStructUpdate(true, triple.get("src").value, triple.get("edgeFromContourToRelationNode").value, scale);
                    self.eventStructUpdate(true, triple.get("src").value, triple.get("edgeFromContourToEdgeFromRelationNodeToEdgeFromMainNodeToSecondNode").value, scale);
                }
            };

            return levelNodes;
        };

        searchAllLevelEdges([mainElements], levelScales, 1, [...mainElements]);
            //от него и к нему делаем поиск троек
            //сделали result 1го уровня 1 массив
            //передаем скайл
            //отдаем циелом на апдейт
        if (mainElements.length) return;

        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            [new sc.ScAddr(this.addr), "src"],
            [sc.ScType.EdgeAccessVarPosPerm, "edge"],
            sc.ScType.Unknown);
        let result = await window.scClient.templateSearch(scTemplate);
        if (result.length > maxNumberOfTriplets) {
            result.splice(maxNumberOfTriplets-1, result.length-maxNumberOfTriplets);
        }
        for (let triple of result) {
            self.eventStructUpdate(true, triple.get("src").value, triple.get("edge").value, { node: 1, link: 1 });
        }
    }
    else {
        let content = await window.scClient.getLinkContents([new sc.ScAddr(this.addr)]);
        await self.onDataAppend(content[0].data);
    }
};

// ------ Translation ---------
/**
 * This function returns list of objects, that can be translated.
 * Just for internal usage in core.
 */
SCWeb.core.ComponentSandbox.prototype.getObjectsToTranslate = function () {
    if (this.eventGetObjectsToTranslate)
        return this.eventGetObjectsToTranslate();

    return [];
};

/**
 * This function apply translation to component.
 * Just for internal usage in core
 * @param {Object} translation_map Dictionary of translation
 */
SCWeb.core.ComponentSandbox.prototype.updateTranslation = function (translation_map) {
    if (this.eventApplyTranslation)
        this.eventApplyTranslation(translation_map);
};

// ----- Arguments ------
SCWeb.core.ComponentSandbox.prototype._fireArgumentsChanged = function () {
    if (this.eventArgumentsUpdate)
        this.eventArgumentsUpdate(SCWeb.core.Arguments._arguments.slice(0));
};

/**
 * Calls when new argument added
 * @param {String} argument sc-addr of argument
 * @param {Number} idx Index of argument
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentAppended = function (argument, idx) {
    this._fireArgumentsChanged();
};

/**
 * Calls when new argument removed
 * @param {String} argument sc-addr of argument
 * @param {Number} idx Index of argument
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentRemoved = function (argument, idx) {
    this._fireArgumentsChanged();
};

/**
 * Calls when arguments list cleared
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentCleared = function () {
    this._fireArgumentsChanged();
};

// --------- Window -----------
SCWeb.core.ComponentSandbox.prototype.onWindowActiveChanged = function (is_active) {
    if (this.eventWindowActiveChanged)
        this.eventWindowActiveChanged(is_active);
};

// --------- Data -------------
SCWeb.core.ComponentSandbox.prototype.onDataAppend = function (data) {
    if (this.eventDataAppend) {
        return this.eventDataAppend(data);
    } else {
        return Promise.resolve();
    }
};

SCWeb.core.ComponentSandbox.prototype.translate = function () {
    return SCWeb.core.Translation.translate(this.getObjectsToTranslate())
        .then((namesMap) => this.updateTranslation(namesMap));
};
