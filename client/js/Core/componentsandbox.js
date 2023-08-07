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
    this.addr = parseInt(options.addr);
    this.contentBucket = [];
    this.contentBucketSize = 20;
    this.appendContentTimeoutId = 0;
    this.appendContentTimeout = 2;
    this.maxSCgTriplesNumber = 300;
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
                    if (type.equal(sc.ScType.EdgeAccessConstPosPerm)) {
                        self.eventStructUpdate({
                            isAdded: true,
                            connectorFromScene: edge,
                            sceneElement: otherAddr,
                            sceneElementState: SCgObjectState.NewInMemory
                        });
                    }
                }
            });
        let removeArcEventRequest = new sc.ScEventParams(
            new sc.ScAddr(this.addr),
            sc.ScEventType.RemoveOutgoingEdge,
            async (elAddr, edge, otherAddr) => {
                if (self.eventStructUpdate
                    && !(await window.scHelper.checkEdge(elAddr.value, sc.ScType.EdgeAccessConstPosPerm, otherAddr.value))) {
                    self.eventStructUpdate({
                        isAdded: false,
                        connectorFromScene: edge,
                        sceneElement: otherAddr
                    });
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

SCWeb.core.ComponentSandbox.prototype.getIdentifier = function (addr, callback) {
    SCWeb.core.Server.resolveIdentifiers([addr]).then(function (idtfs) {
        callback(idtfs[addr]);
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

/*! Function takes content of sc-link or structure from server and call event handlers
 * {String} contentType type of content data (@see scClient.getLinkContent). If it's null, then
 * data will be returned as string
 */
SCWeb.core.ComponentSandbox.prototype.updateContent = async function (scAddr, scene) {
    let self = this;
    const sceneAddr = new sc.ScAddr(self.addr);
    if (scAddr) self.scAddr = new sc.ScAddr(scAddr);
    if (scene) self.scene = scene;

    const updateDistanceBasedSCgWindow = async (sceneAddr) => {
        self.layout = () => {
            self.scAddr ? self.scene.updateRender() : self.scene.layout();
        };

        self.postLayout = () => {
            self.scAddr ? self.scene.layout() : self.scene.updateRender();
        };

        const verifyStructureElement = async (structure, element) => {
            let template = new sc.ScTemplate();
            template.triple(
                structure,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                [element, "_main_node"]
            );

            const result = await scClient.templateSearch(template);
            return result.map((triple) => {
                return {connectorFromStructure: triple.get("_edge_from_scene"), structureElement: triple.get("_main_node")};
            });
        };

        const searchAllLevelEdges = async function (elementsArr, visitedElements, tracedElements) {
            let newElementsArr = [];
            for (let i = 0; i < elementsArr.length; i++) {

                let levelElements = elementsArr[i];
                for (let elementHash in levelElements) {
                    if (visitedElements.has(elementHash)) continue;
                    visitedElements.add(elementHash);

                    const element = new sc.ScAddr(parseInt(elementHash));

                    const [elementType, level, edgeFromScene] = Object.values(levelElements[elementHash]);
                    const nextLevel = level >= SCgObjectLevel.Count - 1 ? SCgObjectLevel.Seventh : level + 1;

                    const searchFunc = elementType.isEdge() ? searchLevelEdgeElements : searchLevelEdges;
                    const newElements = await searchFunc(
                        edgeFromScene, element, elementType, level, nextLevel, tracedElements);
                    if (Object.keys(newElements).length) newElementsArr.push(newElements);
                }
            }

            if (newElementsArr.length) await searchAllLevelEdges(newElementsArr, visitedElements, tracedElements);
        };

        const searchLevelEdges = async function (
            edgeFromScene, mainElement, mainElementType, level, nextLevel, tracedElements) {
            let nextLevelElements = {};

            await searchLevelEdgesByDirection(
                edgeFromScene, mainElement, mainElementType,
                level, nextLevel, nextLevelElements, tracedElements, true
            );
            await searchLevelEdgesByDirection(
                edgeFromScene, mainElement, mainElementType,
                level, nextLevel, nextLevelElements, tracedElements, false
            );

            return nextLevelElements;
        };

        const searchLevelEdgeElements = async function (
            edgeFromScene, mainElement, mainElementType, level, nextLevel, tracedElements) {
            let nextLevelElements = {};

            await searchLevelConnectorElements(
                edgeFromScene, mainElement, mainElementType,
                level, nextLevel, nextLevelElements, tracedElements
            );
            await searchLevelEdgesByDirection(
                edgeFromScene, mainElement, mainElementType,
                level, nextLevel, nextLevelElements, tracedElements, true
            );
            await searchLevelEdgesByDirection(
                edgeFromScene, mainElement, mainElementType,
                level, nextLevel, nextLevelElements, tracedElements, false
            );

            return nextLevelElements;
        };

        const searchLevelConnectorElements = async function (
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements
        ) {
            const mainElementHash = mainElement.value;
            if (tracedElements.has(mainElementHash)) return;
            tracedElements.add(mainElementHash);

            const connectorElements = await window.scHelper.getConnectorElements(mainElement);
            const [sourceElement, targetElement] = connectorElements;
            const [sourceElementType, targetElementType] = await scClient.checkElements(connectorElements);

            if (!edgeFromScene) {
                let scTemplateSearchEdgeElements = new sc.ScTemplate();
                scTemplateSearchEdgeElements.triple(
                    sceneAddr,
                    [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                    mainElement,
                );
                const result = await scClient.templateSearch(scTemplateSearchEdgeElements);
                edgeFromScene = result.length ? result[0].get("_edge_from_scene") : mainElement;
            }

            const sourceElementHash = sourceElement.value;
            nextLevelElements[sourceElementHash] = {type: sourceElementType, level: nextLevel};

            const targetElementHash = targetElement.value;
            nextLevelElements[targetElementHash] = {type: targetElementType, level: nextLevel};

            self.eventStructUpdate({
                isAdded: true,
                connectorFromScene: edgeFromScene,
                sceneElement: mainElement,
                sceneElementType: mainElementType,
                sceneElementLevel: level,
                sceneElementSource: sourceElement,
                sceneElementSourceType: sourceElementType,
                sceneElementSourceLevel: nextLevel,
                sceneElementTarget: targetElement,
                sceneElementTargetType: targetElementType,
                sceneElementTargetLevel: nextLevel,
            });
        }

        const searchLevelEdgesByDirection = async function (
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements, withIncomingEdge) {
            let scTemplate = new sc.ScTemplate();
            scTemplate.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                [sc.ScType.Unknown, "_scene_edge"],
            );
            if (withIncomingEdge) {
                scTemplate.triple(
                    [sc.ScType.Unknown, "_scene_edge_source"],
                    "_scene_edge",
                    mainElement,
                );
            } else {
                scTemplate.triple(
                    mainElement,
                    "_scene_edge",
                    [sc.ScType.Unknown, "_scene_edge_target"],
                );
            }
            const constructions = await scClient.templateSearch(scTemplate);

            const sceneEdgeTypes = await scClient.checkElements(
                constructions.map(triple => triple.get("_scene_edge")));
            const sceneEdgeElementTypes = await scClient.checkElements(
                constructions.map(triple => withIncomingEdge
                    ? triple.get("_scene_edge_source") : triple.get("_scene_edge_target")));

            for (let i = 0; i < constructions.length; ++i) {
                const construction = constructions[i];

                edgeFromScene = construction.get("_edge_from_scene");

                const sceneEdge = construction.get("_scene_edge");
                const sceneEdgeHash = sceneEdge.value;
                const sceneEdgeType = sceneEdgeTypes[i];

                const sceneEdgeElement = withIncomingEdge
                    ? construction.get("_scene_edge_source")
                    : construction.get("_scene_edge_target");
                // if we searched scene structure we'll skip it
                if (sceneEdgeElement.equal(sceneAddr)) continue;

                if (tracedElements.has(sceneEdgeHash)) continue;
                tracedElements.add(sceneEdgeHash);
                nextLevelElements[sceneEdgeHash] = {
                    type: sceneEdgeType, level: nextLevel, connectorFromScene: edgeFromScene};

                const sceneEdgeElementHash = sceneEdgeElement.value;
                const sceneEdgeElementType = sceneEdgeElementTypes[i];
                nextLevelElements[sceneEdgeElementHash] = {type: sceneEdgeElementType, level: nextLevel};

                self.eventStructUpdate({
                    isAdded: true,
                    connectorFromScene: edgeFromScene,
                    sceneElement: sceneEdge,
                    sceneElementType: sceneEdgeType,
                    sceneElementLevel: nextLevel,
                    sceneElementSource: withIncomingEdge ? sceneEdgeElement : mainElement,
                    sceneElementSourceType: withIncomingEdge ? sceneEdgeElementType : mainElementType,
                    sceneElementSourceLevel: withIncomingEdge ? nextLevel : level,
                    sceneElementTarget: withIncomingEdge ? mainElement : sceneEdgeElement,
                    sceneElementTargetType: withIncomingEdge ? mainElementType : sceneEdgeElementType,
                    sceneElementTargetLevel: withIncomingEdge ? level : nextLevel,
                });
            }
        };

        let keyElements = self.scAddr
            ? await verifyStructureElement(sceneAddr, self.scAddr)
            : await window.scHelper.getStructureMainKeyElements(sceneAddr);
        if (!keyElements.length) keyElements = await window.scHelper.getStructureKeyElements(sceneAddr);
        if (keyElements.length) self.isSceneWithKey = true;
        if (!keyElements.length) return false;

        const elementTypes = await scClient.checkElements(keyElements.map(triple => triple.structureElement));

        let mainElements = {};
        for (let i = 0; i < keyElements.length; ++i) {
            const triple = keyElements[i];
            const edgeFromScene = triple.connectorFromStructure;
            const sceneElement = triple.structureElement;
            const sceneElementType = elementTypes[i];
            const level = SCgObjectLevel.First;

            mainElements[sceneElement.value] = {
                type: sceneElementType, level: level, connectorFromScene: edgeFromScene};
            self.mainElement = sceneElement;

            self.eventStructUpdate({
                isAdded: true,
                connectorFromScene: edgeFromScene,
                sceneElement: sceneElement,
                sceneElementType: sceneElementType,
                sceneElementLevel: level,
            });
        }

        await searchAllLevelEdges([mainElements], new Set(), new Set());
        return true;
    }

    const updateDefaultSCgWindow = async (sceneAddr) => {
        self.layout = () => {
            self.scene.layout();
        };

        self.postLayout = () => {
            self.scene.updateRender();
        };

        const splitArray = (result, maxNumberOfTriplets) => {
            if (result.length < maxNumberOfTriplets) return result;
            return result.splice(0, maxNumberOfTriplets);
        };
        const filterTriples = (triples, sceneElementTypes, filterList) => {
            triples = triples.filter((triple, index) => sceneElementTypes[index].isEdge());
            sceneElementTypes = sceneElementTypes.filter(type => type.isEdge());
            if (filterList) triples = triples.filter(triple => !filterList.some(element => element === triple.get("_scene_edge").value));
            triples = splitArray(triples, self.maxSCgTriplesNumber);
            sceneElementTypes = splitArray(sceneElementTypes, self.maxSCgTriplesNumber);
            return [triples, sceneElementTypes];
        };

        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            sceneAddr,
            [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
            [sc.ScType.Unknown, "_scene_edge"],
        );
        let triples = (await scClient.templateSearch(scTemplate)).map((triple) => {
            return {
                connectorFromScene: triple.get("_edge_from_scene"),
                sceneElement: triple.get("_scene_edge"),
            };
        });
        let sceneElementTypes = await scClient.checkElements(triples.map(triple => triple.sceneElement));
        [triples, sceneElementTypes] = filterTriples(triples, sceneElementTypes, null);

        for (let i = 0; i < triples.length; ++i) {
            const triple = triples[i];
            triple.isAdded = true;
            triple.sceneElementType = sceneElementTypes[i];

            self.eventStructUpdate(triple);
        }
    };

    const updateLinkWindow = async (linkAddr) => {
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

        await appendData(linkAddr);
    };

    if (this.is_struct && this.eventStructUpdate) {
        if (SCWeb.core.Main.viewMode === SCgViewMode.DistanceBasedSCgView) {
            updateDistanceBasedSCgWindow(sceneAddr).then(result => {
                if (!result) updateDefaultSCgWindow(sceneAddr).then(null);
            });
        } else {
            updateDefaultSCgWindow(sceneAddr).then(null);
        }
    }
    else if (sceneAddr) updateLinkWindow(sceneAddr).then(null);
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
