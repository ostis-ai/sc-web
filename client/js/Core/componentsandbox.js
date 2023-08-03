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
    if (scAddr) scAddr = new sc.ScAddr(scAddr);
    if (scene) self.scene = scene;

    const splitResult = (result, maxNumberOfTriplets) => {
        if (result.length < maxNumberOfTriplets) return result;
        return result.splice(maxNumberOfTriplets - 1, result.length - maxNumberOfTriplets);
    };
    const filterResult = (triples, sceneElementTypes, filterList) => {
        triples = triples.filter((triple, index) => sceneElementTypes[index].isEdge());
        sceneElementTypes = sceneElementTypes.filter(type => type.isEdge());
        if (filterList) triples = triples.filter(triple => !filterList.some(element => element === triple.get("_scene_edge").value));
        triples = splitResult(triples, 800);
        return [triples, sceneElementTypes];
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

    const updateScgViewOnlyWindow = async (sceneAddr) => {
        const level1Styles = { node: 2.3, link: 1.8, opacity: 1, widthEdge: 8, stroke: 'black', fill: '#00a' };
        const level2Styles = { node: 1.8, link: 1.5, opacity: 1, widthEdge: 7.5, stroke: 'black', fill: '#00a' };
        const level3Styles = { node: 1.4, link: 1, opacity: 1, widthEdge: 7, stroke: 'black', fill: '#00a' };
        const level4Styles = { node: 1, link: 1, opacity: 1, widthEdge: 6.5, stroke: 'black', fill: '#00a' };
        const level5Styles = { node: 1, link: 1, opacity: 0.8, widthEdge: 6.5, stroke: 'black', fill: '#00a' };
        const level6Styles = { node: 1, link: 1, opacity: 0.6, widthEdge: 6.5, stroke: 'black', fill: '#00a' };
        const level7Styles = { node: 1, link: 1, opacity: 0.4, widthEdge: 6.5, stroke: 'black', fill: '#00a' };

        const allLevelStyles = [
            level1Styles, level2Styles, level3Styles, level4Styles, level5Styles, level6Styles, level7Styles
        ];

        self.layout = () => {
            scAddr ? self.scene.updateRender() : self.scene.layout();
        };

        self.postLayout = () => {
            scAddr ? self.scene.layout() : self.scene.updateRender();
        };

        const getSceneElementsByRelation = async (relation) => {
            let template = new sc.ScTemplate();
            template.tripleWithRelation(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                [sc.ScType.Unknown, "_main_node"],
                sc.ScType.EdgeAccessVarPosPerm,
                relation,
            );

            const result = await window.scClient.templateSearch(template);
            return result.map((triple) => {
                return {connectorFromScene: triple.get("_edge_from_scene"), sceneElement: triple.get("_main_node")};
            });
        };

        const getSceneMainKeyElements = async () => {
            return await getSceneElementsByRelation(new sc.ScAddr(window.scKeynodes['rrel_main_key_sc_element']));
        };

        const getSceneKeyElements = async () => {
            return await getSceneElementsByRelation(new sc.ScAddr(window.scKeynodes['rrel_key_sc_element']));
        };

        const verifySceneElement = async (targetAddr) => {
            let template = new sc.ScTemplate();
            template.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                [targetAddr, "_main_node"]
            );

            const result = await scClient.templateSearch(template);
            return result.map((triple) => {
                return {connectorFromScene: triple.get("_edge_from_scene"), sceneElement: triple.get("_main_node")};
            });
        };

        const searchAllLevelEdges = async function (elementsArr, allLevelStyles, level, visitedElements) {
            const prevLevelStyles = level >= allLevelStyles.length ? allLevelStyles.slice(-2) : allLevelStyles[level - 1];
            const levelStyles = level >= allLevelStyles.length ? allLevelStyles.slice(-1) : allLevelStyles[level];

            let newElementsArr = [];
            for (let i = 0; i < elementsArr.length; i++) {

                let elements = elementsArr[i];
                for (let elementHash in elements) {
                    const elementType = elements[elementHash];
                    const newElements = await searchLevelEdges(
                        new sc.ScAddr(parseInt(elementHash)), elementType, prevLevelStyles,
                        levelStyles, visitedElements);
                    if (Object.keys(newElements).length) newElementsArr.push(newElements);
                }
            }

            if (newElementsArr.length) await searchAllLevelEdges(newElementsArr, allLevelStyles, level + 1, visitedElements);
        };

        const searchLevelEdges = async function (
            mainElement, mainElementType, prevLevelStyles, levelStyles, visitedElements) {
            let levelNodes = {};
            const newVisitedElementsToSecondElementsWithoutRelations = await searchLevelEdgesByDirection(
                mainElement, mainElementType, prevLevelStyles, levelStyles,
                visitedElements, levelNodes, false, true);
            const newVisitedElementsToSecondElementsWithRelations = await searchLevelEdgesByDirection(
                mainElement, mainElementType, prevLevelStyles, levelStyles,
                visitedElements, levelNodes, false, false);
            const newVisitedElementsFromSecondElementsWithoutRelations = await searchLevelEdgesByDirection(
                mainElement, mainElementType, prevLevelStyles, levelStyles,
                visitedElements, levelNodes, true, true);
            const newVisitedElementsFromSecondElementsWithRelations = await searchLevelEdgesByDirection(
                mainElement, mainElementType, prevLevelStyles, levelStyles,
                visitedElements, levelNodes, true, false);
            const newVisitedElementsToSecondEdges = await searchLevelEdgesToEdges(
                mainElement, mainElementType, prevLevelStyles, levelStyles,
                visitedElements, levelNodes
            )

            const mergeSets = function (resultSet, sets) {
                for (const s of sets) {
                    for (const element of s) {
                        resultSet.add(element);
                    }
                }
            }
            mergeSets(visitedElements,
                [newVisitedElementsToSecondElementsWithoutRelations,
                    newVisitedElementsToSecondElementsWithRelations,
                    newVisitedElementsFromSecondElementsWithoutRelations,
                    newVisitedElementsFromSecondElementsWithRelations,
                    newVisitedElementsToSecondEdges
                ]
            );
            return levelNodes;
        };

        const searchLevelEdgesToEdges = async function (
            mainElement, mainElementType, prevLevelStyles, levelStyles,
            visitedElements, levelNodes
        ) {
            let newVisitedElements = new Set();

            let scTemplateSearchEdgeElements = new sc.ScTemplate();
            scTemplateSearchEdgeElements.triple(
                mainElement,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_main_element"],
                [sc.ScType.Unknown, "_main_element_edge"],
            );
            scTemplateSearchEdgeElements.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene_to_edge_from_main_element"],
                "_edge_from_main_element",
            );
            scTemplateSearchEdgeElements.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene_to_main_element_edge"],
                "_main_element_edge",
            );
            scTemplateSearchEdgeElements.triple(
                [sc.ScType.Unknown, "_main_element_edge_source"],
                "_main_element_edge",
                [sc.ScType.Unknown, "_main_element_edge_target"],
            );
            const triples = await scClient.templateSearch(scTemplateSearchEdgeElements);

            const edgeFromMainElementTypes = await scClient.checkElements(
                triples.map(triple => triple.get("_edge_from_main_element")));
            const mainElementEdgeTypes = await scClient.checkElements(
                triples.map(triple => triple.get("_main_element_edge")));
            const mainElementEdgeSourceTypes = await scClient.checkElements(
                triples.map(triple => triple.get("_main_element_edge_source")));
            const mainElementEdgeTargetTypes = await scClient.checkElements(
                triples.map(triple => triple.get("_main_element_edge_target")));

            for (let i = 0; i < triples.length; ++i) {
                const triple = triples[i];

                const mainElementEdge = triple.get("_main_element_edge");
                const mainElementEdgeHash = mainElementEdge.value;
                const mainElementEdgeType = mainElementEdgeTypes[i];
                if (visitedElements.has(mainElementEdgeHash)) continue;
                newVisitedElements.add(mainElementEdgeHash);

                const mainElementEdgeSource = triple.get("_main_element_edge_source");
                const mainElementEdgeTarget = triple.get("_main_element_edge_target");
                if (!mainElementEdgeSource.isValid() && !mainElementEdgeTarget.isValid()) continue;

                const mainElementEdgeSourceHash = mainElementEdgeSource.value;
                const mainElementEdgeSourceType = mainElementEdgeSourceTypes[i];
                levelNodes[mainElementEdgeSourceHash] = mainElementEdgeSourceType;

                const mainElementEdgeTargetHash = mainElementEdgeTarget.value;
                const mainElementEdgeTargetType = mainElementEdgeTargetTypes[i];
                levelNodes[mainElementEdgeTargetHash] = mainElementEdgeTargetType;

                const edgeFromSceneToMainElementEdge = triple.get("_edge_from_scene_to_main_element_edge");

                self.eventStructUpdate({
                    isAdded: true,
                    connectorFromScene: edgeFromSceneToMainElementEdge,
                    sceneElement: mainElementEdge,
                    sceneElementType: mainElementEdgeType,
                    sceneElementStyles: levelStyles,
                    sceneElementSource: mainElementEdgeSource,
                    sceneElementSourceType: mainElementEdgeSourceType,
                    sceneElementSourceStyles: levelStyles,
                    sceneElementTarget: mainElementEdgeTarget,
                    sceneElementTargetType: mainElementEdgeTargetType,
                    sceneElementTargetStyles: levelStyles,
                });

                const edgeFromMainElement = triple.get("_edge_from_main_element");
                const edgeFromMainElementHash = edgeFromMainElement.value;
                const edgeFromMainElementType = edgeFromMainElementTypes[i];
                if (visitedElements.has(edgeFromMainElementHash)) continue;
                newVisitedElements.add(edgeFromMainElementHash);

                const edgeFromSceneToEdgeFromMainElement = triple.get("_edge_from_scene_to_edge_from_main_element");

                self.eventStructUpdate({
                    isAdded: true,
                    connectorFromScene: edgeFromSceneToEdgeFromMainElement,
                    sceneElement: edgeFromMainElement,
                    sceneElementType: edgeFromMainElementType,
                    sceneElementStyles: levelStyles,
                    sceneElementSource: mainElement,
                    sceneElementSourceType: mainElementType,
                    sceneElementSourceStyles: prevLevelStyles,
                    sceneElementTarget: mainElementEdge,
                    sceneElementTargetType: mainElementEdgeType,
                    sceneElementTargetStyles: levelStyles,
                });
            }

            return newVisitedElements;
        }

        const searchLevelEdgesByDirection = async function (
            mainElement, mainElementType, prevLevelStyles, levelStyles,
            visitedElements, levelNodes, isIncomingEdge, withRelation) {
            let newVisitedElements = new Set();

            let scTemplate = new sc.ScTemplate();
            scTemplate.triple(
                sceneAddr,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                [sc.ScType.Unknown, "_scene_edge"],
            );
            if (isIncomingEdge) {
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
            if (withRelation) {
                scTemplate.triple(
                    [sc.ScType.NodeVar, "_relation"],
                    [sc.ScType.EdgeAccessVarPosPerm, "_relation_edge"],
                    "_scene_edge",
                );
                scTemplate.triple(
                    sceneAddr,
                    [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene_to_relation_edge"],
                    "_relation_edge",
                );
            }
            const triples = await scClient.templateSearch(scTemplate);

            const sceneEdgeTypes = await scClient.checkElements(
                triples.map(triple => triple.get("_scene_edge")));
            const sceneEdgeElementTypes = await scClient.checkElements(
                triples.map(triple => isIncomingEdge ? triple.get("_scene_edge_source") : triple.get("_scene_edge_target")));

            let sceneRelationTypes, sceneEdgeFromRelationTypes;
            if (withRelation) {
                sceneRelationTypes = await scClient.checkElements(triples.map(triple => triple.get("_relation")));
                sceneEdgeFromRelationTypes = await scClient.checkElements(
                    triples.map(triple => triple.get("_relation_edge")));
            }

            for (let i = 0; i < triples.length; ++i) {
                const triple = triples[i];

                const sceneEdge = triple.get("_scene_edge");
                const sceneEdgeHash = sceneEdge.value;
                const sceneEdgeType = sceneEdgeTypes[i];

                if (visitedElements.has(sceneEdgeHash)) continue;
                newVisitedElements.add(sceneEdgeHash);

                const sceneEdgeElement = isIncomingEdge ? triple.get("_scene_edge_source") : triple.get("_scene_edge_target");
                const sceneEdgeElementHash = sceneEdgeElement.value;
                const sceneEdgeElementType = sceneEdgeElementTypes[i];
                levelNodes[sceneEdgeElementHash] = sceneEdgeElementType;

                let edgeFromScene = triple.get("_edge_from_scene");

                self.eventStructUpdate({
                    isAdded: true,
                    connectorFromScene: edgeFromScene,
                    sceneElement: sceneEdge,
                    sceneElementType: sceneEdgeType,
                    sceneElementStyles: levelStyles,
                    sceneElementSource: isIncomingEdge ? sceneEdgeElement : mainElement,
                    sceneElementSourceType: isIncomingEdge ? sceneEdgeElementType : mainElementType,
                    sceneElementSourceStyles: isIncomingEdge ? levelStyles : prevLevelStyles,
                    sceneElementTarget: isIncomingEdge ? mainElement : sceneEdgeElement,
                    sceneElementTargetType: isIncomingEdge ? mainElementType : sceneEdgeElementType,
                    sceneElementTargetStyles: isIncomingEdge ? prevLevelStyles : levelStyles,
                });

                if (withRelation) {
                    const relationEdge = triple.get("_relation_edge");
                    const relationEdgeHash = relationEdge.value;
                    if (visitedElements.has(relationEdgeHash)) continue;
                    newVisitedElements.add(relationEdgeHash);

                    const relation = triple.get("_relation");
                    const relationHash = relation.value;
                    const relationType = sceneRelationTypes[i];
                    levelNodes[relationHash] = relationType;

                    edgeFromScene = triple.get("_edge_from_scene_to_relation_edge");

                    self.eventStructUpdate({
                        isAdded: true,
                        connectorFromScene: edgeFromScene,
                        sceneElement: relationEdge,
                        sceneElementType: sceneEdgeFromRelationTypes[i],
                        sceneElementStyles: levelStyles,
                        sceneElementSource: relation,
                        sceneElementSourceType: relationType,
                        sceneElementSourceStyles: levelStyles,
                        sceneElementTarget: sceneEdge,
                        sceneElementTargetType: sceneEdgeType,
                        sceneElementTargetStyles: levelStyles,
                    });
                }
            }

            return newVisitedElements;
        };

        let keyElements = scAddr ? await verifySceneElement(scAddr) : await getSceneMainKeyElements();
        if (!scAddr) self.isSceneWithMainKey = keyElements.length;
        if (!keyElements.length) keyElements = await getSceneKeyElements();
        if (self.isSceneWithMainKey || keyElements.length) self.isSceneWithKey = true;

        const elementTypes = await scClient.checkElements(keyElements.map(triple => triple.sceneElement));

        let visitedElements = new Set();
        let mainElements = {};
        for (let i = 0; i < keyElements.length; ++i) {
            const triple = keyElements[i];
            const sceneElement = triple.sceneElement;
            const sceneElementType = elementTypes[i];

            if (visitedElements.has(sceneElement.value)) continue;
            visitedElements.add(sceneElement.value);
            mainElements[sceneElement.value] = sceneElementType;
            self.mainElement = triple.sceneElement;

            self.eventStructUpdate({
                isAdded: true,
                connectorFromScene: triple.connectorFromScene,
                sceneElement: triple.sceneElement,
                sceneElementType: sceneElementType,
                sceneElementStyles: allLevelStyles[0],
            });
        }

        await searchAllLevelEdges([mainElements], allLevelStyles, 1, visitedElements);
    }

    const updateScgWindow = async (sceneAddr) => {
        self.layout = () => {
            self.scene.layout();
        };

        self.postLayout = () => {
            self.scene.updateRender();
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
        [triples, sceneElementTypes] = filterResult(triples, sceneElementTypes, null);

        for (let i = 0; i < triples.length; ++i) {
            const triple = triples[i];
            triple.isAdded = true;
            triple.sceneElementType = sceneElementTypes[i];

            self.eventStructUpdate(triple);
        }
    }

    if (this.is_struct && this.eventStructUpdate) {
        if (SCWeb.core.Main.viewMode === SCgViewMode.DistanceBasedSCgView) {
            updateScgViewOnlyWindow(sceneAddr).then(null);
        } else {
            updateScgWindow(sceneAddr).then(null);
        }
    }
    else if (sceneAddr) appendData(sceneAddr).then(null);
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
