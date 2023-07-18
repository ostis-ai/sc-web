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
    this.contentBucket = [];
    this.contentBucketSize = 20;
    this.appendContentTimeoutId = 0;
    this.appendContentTimeout = 2;
    this.content = options.content;
    this.is_struct = options.is_struct;
    this.format_addr = options.format_addr;
    this.is_editor = options.canEdit;
    this.isSceneWithKey = false;
    this.mainElement = null;

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
            async (elAddr, edge, otherAddr) => {
                if (self.eventStructUpdate) {
                    const type = (await scClient.checkElements([edge]))[0];
                    if (type.equal(sc.ScType.EdgeAccessConstPosPerm)) self.eventStructUpdate(true, edge.value, otherAddr.value, type);
                }
            });
        let removeArcEventRequest = new sc.ScEventParams(
            new sc.ScAddr(this.addr),
            sc.ScEventType.RemoveOutgoingEdge,
            async (elAddr, edge, otherAddr) => {
                if (self.eventStructUpdate && !(await window.scHelper.checkEdge(elAddr.value, sc.ScType.EdgeAccessConstPosPerm, otherAddr.value))) {
                    self.eventStructUpdate(false, edge.value, otherAddr.value, 0);
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
            delete this.childs[cntId]
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
        let self = this;
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
    let windows = SCWeb.ui.WindowManager.createViewersForScStructs(containers_map);
    this._appendChilds(windows);
    return windows;
};

/*! Function takes content of sc-link or sctructure from server and call event handlers
 * {String} contentType type of content data (@see scClient.getLinkContent). If it's null, then
 * data will be returned as string
 */
SCWeb.core.ComponentSandbox.prototype.updateContent = async function (scAddr, scene) {
    let self = this;
    const sceneAddr = new sc.ScAddr(self.addr);
    if (scAddr) scAddr = new sc.ScAddr(self.addr);

    const splitResult = (result, maxNumberOfTriplets) => {
        if (result.length < maxNumberOfTriplets) return result;
        return result.splice(maxNumberOfTriplets - 1, result.length - maxNumberOfTriplets);
    };
    const filterResult = (result, filterList) => {
        splitResult(result, 200);
        if (filterList)
            result = result.filter(triple => !filterList.some(element => element === triple.get("_trg").value));
        splitResult(result, 100);
        return result;
    };

    const forceAppendData = async (oldBucket) => {
        for (let content of oldBucket) {
            await self.onDataAppend(content.data);
        }
    };

    const sliceAndForceAppendData = async () => {
        const oldBucket = self.contentBucket.slice();
        self.contentBucket = [];
        await forceAppendData(await scClient.getLinkContents(oldBucket));
    };

    const appendData = async (element) => {
        self.contentBucket.push(element);
        if (self.appendContentTimeoutId) clearTimeout(self.appendContentTimeoutId);

        if (self.contentBucket.length > self.contentBucketSize) {
            clearTimeout(self.appendContentTimeoutId);
            await sliceAndForceAppendData();
        }
        else {
            self.appendContentTimeoutId = setTimeout(sliceAndForceAppendData, self.appendContentTimeout);
        }
    };

    const updateScgViewOnlyWindow = async () => {
        const levelStyles1 = { node: 2.3, link: 1.8, opacity: 1, widthEdge: 8, stroke: 'black', fill: '#00a' };
        const levelStyles2 = { node: 1.8, link: 1.5, opacity: 1, widthEdge: 7.5, stroke: 'black', fill: '#00a' };
        const levelStyles3 = { node: 1.4, link: 1, opacity: 1, widthEdge: 7, stroke: 'black', fill: '#00a' };
        const levelStyles4 = { node: 1, link: 1, opacity: 1, widthEdge: 6.5, stroke: 'black', fill: '#00a' };
        const levelStyles5 = { node: 1, link: 1, opacity: 0.8, widthEdge: 6.5, stroke: 'black', fill: '#00a' };
        const levelStyles6 = { node: 1, link: 1, opacity: 0.6, widthEdge: 6.5, stroke: 'black', fill: '#00a' };
        const levelStyles7 = { node: 1, link: 1, opacity: 0.4, widthEdge: 6.5, stroke: 'black', fill: '#00a' };

        const allLevelStyles = [levelStyles1, levelStyles2, levelStyles3, levelStyles4, levelStyles5, levelStyles6, levelStyles7];

        const getSceneElementsByRelation = async (relation) => {
            let template = new sc.ScTemplate();
            template.tripleWithRelation(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToMainNode"],
                [sc.ScType.Unknown, "mainNode"],
                sc.ScType.EdgeAccessVarPosPerm,
                relation,
            );

            const result = await window.scClient.templateSearch(template);
            return result.map((triple) => {
                return {connectorFromScene: triple.get("edgeFromContourToMainNode"), sceneElement: triple.get("mainNode")};
            });
        };

        const getSceneMainKeyElements = async () => {
            return await getSceneElementsByRelation(new sc.ScAddr(window.scKeynodes['rrel_main_key_sc_element']));
        };

        const getSceneKeyElements = async () => {
            return await getSceneElementsByRelation(new sc.ScAddr(window.scKeynodes['rrel_key_sc_element']));
        };

        let keyElements = await getSceneMainKeyElements();
        if (!scAddr) self.isSceneWithMainKey = keyElements.length;
        if (!keyElements.length) keyElements = await getSceneKeyElements();
        if (self.isSceneWithMainKey || keyElements.length) self.isSceneWithKey = true;

        let mainElements = [];
        for (let triple of keyElements) {
            scAddr
                ? mainElements.push(scAddr.value) && (self.mainElement = scAddr)
                : mainElements.push(triple.target.value) && (self.mainElement = triple.target);
            self.eventStructUpdate(true, {
                connectorFromScene: triple.connectorFromScene,
                sceneElement: triple.sceneElement,
                sceneElementStyles: allLevelStyles[0],
            });
        }

        const searchAllLevelEdges = async function (elementsArr, allLevelStyles, level, visitedElements, relationElements) {
            const levelStyles = level > 6 ? levelStyles7 : allLevelStyles[level];

            let newElementsArr = [];
            for (let i = 0; i < elementsArr.length; i++) {

                let elements = elementsArr[i];
                for (let j = 0; j < elements.length; j++) {
                    let elem = elements[j];
                    let newElements = await searchLevelEdges(new sc.ScAddr(elem), allLevelStyles[level - 1], levelStyles, visitedElements, relationElements);
                    if (newElements.length) newElementsArr.push(newElements);
                }
                await searchAllLevelEdges(newElementsArr, allLevelStyles, level + 1, visitedElements, relationElements);
            }
        };

        const searchLevelEdges = async function (mainElem, prevLevelStyles, levelStyles, visitedElements, relationElements) {
            let outgoingLevelNodesWithRelation = await searchLevelEdgesByDirection(mainElem, prevLevelStyles, levelStyles, visitedElements, relationElements, false, true, false);
            let outgoingLevelNodesNotWithRelation = await searchLevelEdgesByDirection(mainElem, prevLevelStyles, levelStyles, visitedElements, relationElements, false, false, false);
            let incomingLevelNodesNotWithRelation = await searchLevelEdgesByDirection(mainElem, prevLevelStyles, levelStyles, visitedElements, relationElements, true, false, false);
            let incomingLevelNodesWithRelation = await searchLevelEdgesByDirection(mainElem, prevLevelStyles, levelStyles, visitedElements, relationElements, true, true, true);
            return [...incomingLevelNodesWithRelation, ...incomingLevelNodesNotWithRelation, ...outgoingLevelNodesWithRelation, ...outgoingLevelNodesNotWithRelation];
        };

        const searchLevelEdgesByDirection = async function (
            mainElem, prevLevelStyles, levelStyles, visitedElements, relationElements, incomingEdge, withRelation, withEdgeToEdge) {
            let levelNodes = [];

            if (withEdgeToEdge) {
                let scTemplateSearchEdgeElements = new sc.ScTemplate();
                scTemplateSearchEdgeElements.triple(
                    mainElem,
                    sc.ScType.EdgeAccessVarPosPerm,
                    [sc.ScType.Unknown, "edgeElem"],
                );

                scTemplateSearchEdgeElements.triple(
                    sceneAddr,
                    [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToEdgeElem"],
                    "edgeElem",
                );

                scTemplateSearchEdgeElements.triple(
                    [sc.ScType.Unknown, "sourceElem"],
                    "edgeElem",
                    [sc.ScType.Unknown, "targetElem"],
                );

                let resultEdgeElements = await window.scClient.templateSearch(scTemplateSearchEdgeElements);

                for (let triple of resultEdgeElements) {
                    const edgeElem = triple.get("edgeElem");
                    const edgeToEdgeElem = triple.get("edgeFromContourToEdgeElem");
                    const targetElem = triple.get("targetElem");
                    const sourceElem = triple.get("sourceElem");

                    if (!visitedElements.includes(targetElem.value) && !levelNodes.includes(targetElem.value)
                        || !visitedElements.includes(sourceElem.value) && !levelNodes.includes(sourceElem.value)) {

                        levelNodes.push(targetElem.value);
                        visitedElements.push(targetElem.value);
                        levelNodes.push(sourceElem.value);
                        visitedElements.push(sourceElem.value);

                        self.eventStructUpdate(true, {
                            connectorFromScene: edgeToEdgeElem,
                            sceneElement: edgeElem,
                            sceneElementStyles: levelStyles,
                            sceneElementSource: sourceElem,
                            sceneElementSourceStyles: prevLevelStyles,
                            sceneElementTarget: targetElem,
                            sceneElementTargetStyles: levelStyles,
                        });
                    }
                }

                if (resultEdgeElements.length) relationElements.push(mainElem.value);
            }

            let scTemplate = new sc.ScTemplate();
            scTemplate.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToMainEdge"],
                [sc.ScType.Unknown, "edgeFromMainNodeToSecondElem"],
            );
            if (incomingEdge) {
                scTemplate.triple(
                    [sc.ScType.Unknown, "secondElem"],
                    "edgeFromMainNodeToSecondElem",
                    mainElem,
                );
            } else {
                scTemplate.triple(
                    mainElem,
                    "edgeFromMainNodeToSecondElem",
                    [sc.ScType.Unknown, "secondElem"],
                );
            }
            if (withRelation) {
                scTemplate.triple(
                    [sc.ScType.Unknown, "relationNode"],
                    [sc.ScType.EdgeAccessVarPosPerm, "edgeFromRelationNodeToEdgeFromMainNodeToSecondElem"],
                    "edgeFromMainNodeToSecondElem",
                );
                scTemplate.triple(
                    sceneAddr,
                    [sc.ScType.EdgeAccessVarPosPerm, "edgeFromContourToEdgeFromRelationNodeToedgeFromMainNodeToSecondElem"],
                    "edgeFromRelationNodeToedgeFromMainNodeToSecondElem",
                );
            }

            let result = await window.scClient.templateSearch(scTemplate);
            for (let triple of result) {
                const edgeElem = triple.get("edgeFromMainNodeToSecondElem");
                let edgeToEdgeElem = triple.get("edgeFromContourToMainEdge");
                const secondElem = triple.get("secondElem");

                if (!visitedElements.includes(secondElem.value) && !levelNodes.includes(secondElem.value)) {
                    levelNodes.push(secondElem.value);
                    visitedElements.push(secondElem.value);
                    self.eventStructUpdate(true, {
                        connectorFromScene: edgeToEdgeElem,
                        sceneElement: edgeElem,
                        sceneElementStyles: levelStyles,
                        sceneElementSource: incomingEdge ? secondElem : mainElem,
                        sceneElementSourceStyles: incomingEdge ? levelStyles: prevLevelStyles,
                        sceneElementTarget: incomingEdge ? mainElem : secondElem,
                        sceneElementTargetStyles: incomingEdge ? prevLevelStyles : levelStyles,
                    });
                }

                if (withRelation) {
                    let relationNode = triple.get("relationNode");
                    let edgeFromRelationNode = triple.get("edgeFromRelationNodeToedgeFromMainNodeToSecondElem");
                    edgeToEdgeElem = triple.get("edgeFromContourToEdgeFromRelationNodeToedgeFromMainNodeToSecondElem");

                    if (relationElements.includes(relationNode.value)) continue;

                    if (!visitedElements.includes(relationNode.value) && !levelNodes.includes(relationNode.value)) {
                        levelNodes.push(relationNode.value);
                        visitedElements.push(relationNode.value);
                    }

                    self.eventStructUpdate(true, {
                        connectorFromScene: edgeToEdgeElem,
                        sceneElement: edgeFromRelationNode,
                        sceneElementStyles: levelStyles,
                        sceneElementSource: relationNode,
                        sceneElementSourceStyles: levelStyles,
                        sceneElementTarget: edgeElem,
                        sceneElementTargetStyles: levelStyles,
                    });
                }
            }
            return [...new Set(levelNodes)];
        };

        searchAllLevelEdges([mainElements], allLevelStyles, 1, [...mainElements], []).then(null);
    }

    if (scene) {
        self.scene = scene;
    } 
    if (this.is_struct && this.eventStructUpdate) {
        if (SCWeb.core.Main.mode === SCgEditMode.SCgModeViewOnly) {
            await updateScgViewOnlyWindow();
        } else {
            let scTemplate = new sc.ScTemplate();
            scTemplate.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge"],
                [sc.ScType.Unknown, "_trg"],
            );
            const result = filterResult(await window.scClient.templateSearch(scTemplate), null);

            const triples = result.map((triple) => {
                return {connectorFromScene: triple.get("_edge"), sceneElement: triple.get("_trg")};
            });
            const sceneElementTypes = await scClient.checkElements(triples.map(object => object.sceneElement));

            for (let i = 0; i < triples.length; ++i) {
                const sceneElementType = sceneElementTypes[i];
                if (sceneElementType.value & sc_type_arc_mask) {
                    const triple = triples[i];
                    self.eventStructUpdate(true, {
                        connectorFromScene: triple.connectorFromScene,
                        sceneElement: triple.sceneElement,
                        sceneElementType: sceneElementType,
                    });
                }
            }
        }
    }
    else if (this.addr) {
        appendData(new sc.ScAddr(self.addr)).then(null);
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
