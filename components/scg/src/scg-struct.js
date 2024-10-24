const SCgStructFromScTranslatorImpl = function (_editor, _sandbox) {
    let appendTasks = [],
        removeTasks = [],
        maxAppendBatchLength = 150,
        maxRemoveBatchLength = 2,
        batchDelayTime = 500,
        editor = _editor,
        sandbox = _sandbox;

    function resolveIdtf(addr, obj) {
        sandbox.getIdentifier(addr, function (idtf) {
            obj.setText(idtf);
        });
    }

    function randomPos() {
        return new SCg.Vector3(100 * Math.random(), 100 * Math.random(), 0);
    }

    const debounceBuffered = (func, wait) => {
        let timerId;

        const clear = () => {
            clearTimeout(timerId);
        };

        const debounceBuffered = (tasks, maxBatchLength) => {
            clearTimeout(timerId);
            timerId = setTimeout(() => {
                func(tasks.splice(0, tasks.length));
                sandbox.postLayout(editor.scene);
            }, wait);

            if (tasks.length === maxBatchLength) {
                const batch = tasks.splice(0, tasks.length);
                func(batch);
            }
        };

        return [debounceBuffered, clear];
    };

    const generateNode = function (addr, type) {
        const object = SCg.Creator.generateNode(type, randomPos(), '');
        resolveIdtf(addr, object);
        return object;
    };

    const generateLink = function (addr, type) {
        const containerId = 'scg-window-' + sandbox.addr.value + '-' + addr + '-' + new Date().getUTCMilliseconds();
        const object = SCg.Creator.generateLink(type, randomPos(), containerId);
        resolveIdtf(addr, object);
        return object;
    };

    const generateConnector = function (sourceObject, targetObject, type) {
        return SCg.Creator.generateConnector(sourceObject, targetObject, type);
    };

    const appendObjectToScene = function (object, addr, level, state, isCopy) {
        object.setLevel(level);
        object.setObjectState(state);
        editor.scene.appendObject(object);
        object.setScAddr(addr, isCopy);
    }

    const createAppendCopyObject = function (object) {
        const addr = object.sc_addr;
        const type = object.sc_type;

        let copiedObject;
        if ((type & sc_type_node_link) == sc_type_node_link) {
            copiedObject = generateLink(addr, type);
        } else if (type & sc_type_node) {
            copiedObject = generateNode(addr, type);
        } else if (type & sc_type_connector) {
            copiedObject = generateConnector(object.source, object.target, type);
        }

        appendObjectToScene(copiedObject, addr, object.level, object.state, true);
        return copiedObject;
    };

    const doAppendBatch = function (batch) {
        for (let i in batch) {
            const task = batch[i];
            const addr = task[0];
            const type = task[1];
            let state = task[2];
            const level = task[3];

            if (!state) state = SCgObjectState.FromMemory;

            let object = editor.scene.getObjectByScAddr(addr);
            if (object) {
                const updateObject = function (object) {
                    if (sandbox.onceUpdatableObjects && sandbox.onceUpdatableObjects[object.id]) return;
                    if (sandbox.onceUpdatableObjects) sandbox.onceUpdatableObjects[object.id] = true;

                    object.setLevel(level);
                    object.setObjectState(state);
                };

                for (let key in object.copies) {
                    const copy = object.copies[key];
                    updateObject(copy);
                }
                updateObject(object);

                continue;
            }

            if ((type & sc_type_node_link) == sc_type_node_link) {
                object = generateLink(addr, type);
            } else if (type & sc_type_node) {
                object = generateNode(addr, type);
            } else if (type & sc_type_connector) {
                const sourceHash = task[4];
                const targetHash = task[5];

                const sourceObject = editor.scene.getObjectByScAddr(sourceHash);
                let targetObject = editor.scene.getObjectByScAddr(targetHash);
                if (!sourceObject || !targetObject) {
                    addAppendTask(addr, task);
                    continue;
                }

                const multipleConnectors = editor.scene.connectors.filter(
                    connector => connector.source.sc_addr === sourceHash && connector.target.sc_addr === targetHash);
                if (sourceHash === targetHash || multipleConnectors.length > 0) targetObject = createAppendCopyObject(targetObject);
                object = generateConnector(sourceObject, targetObject, type);
            }
            appendObjectToScene(object, addr, level, state);
        }

        sandbox.layout(editor.scene);
    };

    const [debounceBufferedDoAppendBatch] = debounceBuffered(doAppendBatch, batchDelayTime);

    const addAppendTask = function (addr, args) {
        appendTasks.push(args);

        debounceBufferedDoAppendBatch(appendTasks, maxAppendBatchLength);
    };

    const doRemoveBatch = function (batch) {
        for (let i in batch) {
            const task = batch[i];
            const addr = task[0];

            const object = editor.scene.getObjectByScAddr(addr);
            if (!object) continue;

            let objects = [object];
            if (object.copies) {
                for (let [, copy] of Object.entries(object.copies)) {
                    objects.push(copy);
                }
            }

            editor.scene.deleteObjects(objects);
        }
        editor.render.update();
    }

    const [debounceBufferedDoRemoveBatch] = debounceBuffered(doRemoveBatch, batchDelayTime);

    const addRemoveTask = function (addr) {
        removeTasks.push([addr]);

        debounceBufferedDoRemoveBatch(removeTasks, maxRemoveBatchLength);
    };

    const getElementsTypes = async (elements) => {
        return await scClient.getElementsTypes(elements);
    };

    const update = async (data) => {
        const sceneElementState = data.sceneElementState;
        const isAdded = sceneElementState !== SCgObjectState.RemovedFromMemory;
        const sceneElement = data.sceneElement;
        const sceneElementHash = sceneElement.value;

        if (isAdded) {
            const sceneElementType = data.sceneElementType
                ? data.sceneElementType
                : (await getElementsTypes([sceneElement]))[0];
            const sceneElementTypeValue = sceneElementType.value;
            const sceneElementLevel = data.sceneElementLevel;

            if (data.sceneElementSource && data.sceneElementTarget) {
                const sourceHash = data.sceneElementSource.value;
                const sourceTypeValue = data.sceneElementSourceType.value;
                const sourceLevel = data.sceneElementSourceLevel;
                if (!data.sceneElementSourceType.isConnector()) {
                    addAppendTask(sourceHash, [sourceHash, sourceTypeValue, sceneElementState, sourceLevel]);
                }

                const targetHash = data.sceneElementTarget.value;
                const targetTypeValue = data.sceneElementTargetType.value;
                const targetLevel = data.sceneElementTargetLevel;
                if (!data.sceneElementTargetType.isConnector()) {
                    addAppendTask(targetHash, [targetHash, targetTypeValue, sceneElementState, targetLevel]);
                }

                addAppendTask(
                    sceneElementHash,
                    [sceneElementHash, sceneElementTypeValue, sceneElementState, sceneElementLevel, sourceHash, targetHash]
                );
            }
            else if (sceneElementType && sceneElementType.isConnector()) {
                const [source, target] = await window.scHelper.getConnectorElements(sceneElement);
                if (!source.isValid() || !target.isValid()) return;

                const [sourceType, targetType] = await getElementsTypes([source, target]);

                const [sourceHash, targetHash] = [source.value, target.value];

                await update({
                    sceneElementConnector: source,
                    sceneElement: source,
                    sceneElementType: sourceType,
                    sceneElementState: sceneElementState
                });
                await update({
                    sceneElementConnector: target,
                    sceneElement: target,
                    sceneElementType: targetType,
                    sceneElementState: sceneElementState
                });
                addAppendTask(
                    sceneElementHash,
                    [sceneElementHash, sceneElementTypeValue, sceneElementState, sceneElementLevel, sourceHash, targetHash]
                );
            }
            else {
                addAppendTask(sceneElementHash, [sceneElementHash, sceneElementTypeValue, sceneElementState, sceneElementLevel]);
            }
        }
        else {
            addRemoveTask(sceneElementHash);
        }
    };

    return {
        update: async (data) => {
            await update(data);
        }
    }
}

const SCgStructToScTranslatorImpl = function (_editor, _sandbox) {
    let editor = _editor,
        sandbox = _sandbox,
        arcMapping = {},
        objects = [];

    const appendToConstruction = async function (obj) {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            sandbox.addr,
            [sc.ScType.VarPermPosArc, 'arc'],
            new sc.ScAddr(obj.sc_addr)
        );
        let result = await scClient.generateByTemplate(scTemplate);
        arcMapping[result.get('arc').value] = obj;
    };

    const translateIdentifier = async function (obj) {
        const LINK = 'link';
        const objectAddr = new sc.ScAddr(obj.sc_addr);

        // Checks if identifier is allowed to be system identifier (only letter, digits and '_')
        const idtfRelation = /^[a-zA-Z0-9_]+$/.test(obj.text)
            ? new sc.ScAddr(window.scKeynodes['nrel_system_identifier'])
            : new sc.ScAddr(window.scKeynodes['nrel_main_idtf']);

        let template = new sc.ScTemplate();
        template.quintuple(
            objectAddr,
            sc.ScType.VarCommonArc,
            [sc.ScType.VarNodeLink, LINK],
            sc.ScType.VarPermPosArc,
            idtfRelation
        );
        let result = await scClient.searchByTemplate(template);

        let idtfLinkAddr;
        if (result.length) {
            idtfLinkAddr = result[0].get(LINK);
        }
        else {
            result = await scClient.generateByTemplate(template);
            idtfLinkAddr = result.get(LINK);
        }
        await scClient.setLinkContents([new sc.ScLinkContent(obj.text, sc.ScLinkContentType.String, idtfLinkAddr)]);
    };

    const appendObjects = async function () {
        await Promise.all(objects.map(appendToConstruction));
    };

    const fireCallback = async function () {
        editor.render.update();
        editor.scene.layout();
        await appendObjects();
    }

    const translateNodes = async function (nodes) {
        const implFunc = async function (node) {
            if (!node.sc_addr && node.text) {
                let linkAddrs = await scClient.searchLinksByContents([node.text]);
                if (linkAddrs.length) {
                    linkAddrs = linkAddrs[0];
                    if (linkAddrs.length) {
                        let nodeFromKb = await window.scHelper.searchNodeByIdentifier(linkAddrs[0], window.scKeynodes['nrel_system_identifier']);
                        node.setScAddr(nodeFromKb.value);
                        node.setObjectState(SCgObjectState.FromMemory);
                        objects.push(node);
                        return;
                    }
                }
            }

            if (!node.sc_addr) {
                let scConstruction = new sc.ScConstruction();
                scConstruction.generateNode(new sc.ScType(node.sc_type), "node");
                let result = await scClient.generateElements(scConstruction);
                node.setScAddr(result[scConstruction.getIndex("node")].value);
                node.setObjectState(SCgObjectState.NewInMemory);
                objects.push(node);
            }

            if (node.text && node.state === SCgObjectState.NewInMemory) {
                await translateIdentifier(node);
            }
        }
        return Promise.all(nodes.map(implFunc));
    }

    const preTranslateContoursAndBus = async function (nodes, links, connectors, contours, buses) {
        // create sc-struct nodes
        const scAddrGen = async function (c) {
            if (!c.sc_addr) {
                let scConstruction = new sc.ScConstruction();
                scConstruction.generateNode(sc.ScType.ConstNodeStructure, 'node');
                let result = await scClient.generateElements(scConstruction);
                let node = result[scConstruction.getIndex('node')].value;
                c.setScAddr(node);
                c.setObjectState(SCgObjectState.NewInMemory);
                objects.push(c);
            }
            if (c.text && c.state === SCgObjectState.NewInMemory) {
                await translateIdentifier(c);
            }
        };
        let funcs = [];
        for (let i = 0; i < contours.length; ++i) {
            contours[i].addNodesWhichAreInContourPolygon(nodes);
            contours[i].addNodesWhichAreInContourPolygon(links);
            contours[i].addConnectorsWhichAreInContourPolygon(connectors);
            funcs.push(scAddrGen(contours[i]));
        }

        for (let number_bus = 0; number_bus < buses.length; ++number_bus) {
            buses[number_bus].setScAddr(buses[number_bus].source.sc_addr);
        }

        // run tasks
        return Promise.all(funcs);
    }

    const translateConnectors = function (connectors) {
        return new Promise((resolve, reject) => {
            connectors = connectors.filter(e => !e.sc_addr);

            let connectorsNew = [];
            let translatedCount = 0;

            async function doIteration() {
                const connector = connectors.shift();

                function nextIteration() {
                    if (connectors.length === 0) {
                        if (translatedCount === 0 || (connectors.length === 0 && connectorsNew.length === 0))
                            resolve();
                        else {
                            connectors = connectorsNew;
                            connectorsNew = [];
                            translatedCount = 0;
                            window.setTimeout(doIteration, 0);
                        }
                    } else
                        window.setTimeout(doIteration, 0);
                }

                if (connector.sc_addr)
                    reject("Connector already have sc-addr");

                const src = connector.source.sc_addr;
                const trg = connector.target.sc_addr;

                if (src && trg) {
                    let scConstruction = new sc.ScConstruction();
                    scConstruction.generateConnector(new sc.ScType(connector.sc_type), new sc.ScAddr(src), new sc.ScAddr(trg), 'connector');
                    let result = await scClient.generateElements(scConstruction);
                    connector.setScAddr(result[scConstruction.getIndex('connector')].value);
                    connector.setObjectState(SCgObjectState.NewInMemory);
                    objects.push(connector);
                    translatedCount++;
                    nextIteration();
                } else {
                    connectorsNew.push(connector);
                    nextIteration();
                }

            }

            if (connectors.length > 0)
                window.setTimeout(doIteration, 0);
            else
                resolve();

        });
    }

    const translateContours = async function (contours) {
        // now need to process arcs from contours to child elements
        const arcGen = async function (contour, child) {
            let connectorExist = await window.scHelper.checkConnector(contour.sc_addr, sc_type_const_perm_pos_arc, child.sc_addr);
            if (!connectorExist) {
                let scConstruction = new sc.ScConstruction();
                scConstruction.generateConnector(sc.ScType.ConstPermPosArc, new sc.ScAddr(contour.sc_addr), new sc.ScAddr(child.sc_addr), 'connector');
                await scClient.generateElements(scConstruction);
            }
        };

        let acrFuncs = [];
        for (let i = 0; i < contours.length; ++i) {
            const c = contours[i];
            for (let j = 0; j < c.childs.length; ++j) {
                acrFuncs.push(arcGen(c, c.childs[j]));
            }
        }
        return Promise.all(acrFuncs);
    }

    const translateLinks = async function (links) {
        const implFunc = async function (link) {
            const infoConstruction = (link) => {
                let data = link.content;
                let type = sc.ScLinkContentType.String;
                let format = window.scKeynodes['format_txt'];

                if (link.contentType === 'image') {
                    format = window.scKeynodes['format_png'];
                } else if (link.contentType === 'html') {
                    format = window.scKeynodes['format_html'];
                } else if (link.contentType === 'pdf') {
                    format = window.scKeynodes['format_pdf'];
                }

                let langKeynode = SCWeb.core.Translation.getCurrentLanguage();
                return { data, type, format, langKeynode };
            }

            // Find link from kb by system identifier
            if (!link.sc_addr && link.text) {
                let linkSystemIdentifierAddrs = await scClient.searchLinksByContents([link.text]);
                if (linkSystemIdentifierAddrs.length) {
                    linkSystemIdentifierAddrs = linkSystemIdentifierAddrs[0];
                    if (linkSystemIdentifierAddrs.length) {
                        let linkFromKb = await window.scHelper.searchNodeByIdentifier(
                            linkSystemIdentifierAddrs[0], window.scKeynodes['nrel_system_identifier']);
                        link.setScAddr(linkFromKb.value);
                        link.setObjectState(SCgObjectState.FromMemory);
                        objects.push(link);
                    }
                }
            }

            // Create new link
            const { data, type, format } = infoConstruction(link);
            if (link.sc_addr && link.state === SCgObjectState.NewInMemory) {
                const linkContent = new sc.ScLinkContent(data, type, new sc.ScAddr(link.sc_addr));
                await scClient.setLinkContents([linkContent]);
                if (link.text) {
                    await translateIdentifier(link);
                }
                if (link.content && format) {
                    await window.scHelper.setLinkFormat(link.sc_addr, format);
                }
            }
            else if (!link.sc_addr) {
                let construction = new sc.ScConstruction();
                const linkContent = new sc.ScLinkContent(data, type);
                construction.generateLink(new sc.ScType(link.sc_type), linkContent, 'link');
                const result = await scClient.generateElements(construction);
                const linkAddr = result[construction.getIndex('link')].value;
                link.setScAddr(linkAddr);
                link.setObjectState(SCgObjectState.NewInMemory);
                objects.push(link);
                if (link.text) {
                    await translateIdentifier(link);
                }
                if (link.content && format) {
                    await window.scHelper.setLinkFormat(linkAddr, format);
                }
            }
        }

        for (let i = 0; i < links.length; ++i) {
            await implFunc(links[i]);
        }
    }

    return {
        update: async function () {
            editor.scene.commandManager.clear();
            const nodes = editor.scene.nodes.slice();
            const links = editor.scene.links.slice();
            const connectors = editor.scene.connectors.slice();
            const contours = editor.scene.contours.slice();
            const buses = editor.scene.buses.slice();

            await translateNodes(nodes);
            await translateLinks(links);
            await preTranslateContoursAndBus(nodes, links, connectors, contours, buses);
            await translateConnectors(connectors);
            await translateContours(contours);
            await fireCallback();
        }
    }
}

function SCgStructTranslator(_editor, _sandbox) {
    const fromScTranslator = new SCgStructFromScTranslatorImpl(_editor, _sandbox);
    const toScTranslator = new SCgStructToScTranslatorImpl(_editor, _sandbox);

    return {
        updateFromSc: async function (data) {
            await fromScTranslator.update(data);
        },

        translateToSc: async function () {
            await toScTranslator.update();
        }
    };
}
