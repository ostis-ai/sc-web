const debounce_time = (func, wait) => {
    let timerId;

    const clear = () => {
        clearTimeout(timerId);
    };
    const debounced = (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => func(...args), wait);
    };

    return [debounced, clear];
};

function ScgFromScImpl(_sandbox, _editor, aMapping) {

    var self = this,
        arcMapping = aMapping,
        tasks = [],
        timeout = 0,
        batch = null,
        tasksLength = 0,
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

    var [debouncedClearTimer] = debounce_time(() => window.clearInterval(self.timeout), 1500);

    var doBatch = function () {

        if (!batch) {
            if (!tasks.length || tasksLength === tasks.length) {
                window.clearInterval(self.timeout);
                self.timeout = 0;
                return;
            }
            batch = tasks.splice(0, Math.max(150, tasks.length));
            tasksLength = tasks.length;
        }
        if (batch) {

            taskDoneCount = 0;
            for (var i = 0; i < batch.length; ++i) {
                var task = batch[i];
                var addr = task[0];
                var type = task[1];
                var addrNodeorLink = task[2];
                var addrEdge = task[4];
                var addrElemEdgeEnd = task[3];

                if (!addrNodeorLink && sandbox.mainElement) addrNodeorLink = { node: 1.8, link: 1.5, opacity: 1, widthEdge: 7.5, stroke: '#1E90FF', fill: '#1E90FF' };
                if (!addrEdge && sandbox.mainElement) addrEdge = { node: 1.8, link: 1.5, opacity: 1, widthEdge: 7.5, stroke: '#1E90FF', fill: '#1E90FF' };

                let newMainNode = editor.scene.getObjectByScAddr(addr);
                if (newMainNode && sandbox.mainElement) {
                    if (newMainNode instanceof SCg.ModelEdge) {
                        newMainNode.setOpacityElem(addrEdge.opacity);
                        newMainNode.setWidthEdge(addrEdge.widthEdge);
                        newMainNode.setStrokeElem(addrEdge.stroke);
                        newMainNode.setFillElem(addrEdge.fill);
                        continue;
                    }
                    if (newMainNode instanceof SCg.ModelNode) {
                        newMainNode.setScaleElem(addrNodeorLink.node);
                        newMainNode.setOpacityElem(addrNodeorLink.opacity);
                        newMainNode.setStrokeElem(addrNodeorLink.stroke);
                        newMainNode.setFillElem(addrNodeorLink.fill);
                        continue;
                    }
                    if (newMainNode instanceof SCg.ModelLink) {
                        newMainNode.setScaleElem(addrNodeorLink.link);
                        newMainNode.setOpacityElem(addrNodeorLink.opacity);
                        newMainNode.setStrokeElem(addrNodeorLink.stroke);
                        newMainNode.setFillElem(addrNodeorLink.fill);
                        continue;
                    }
                }

                if (type & sc_type_node) {
                    var model_node = SCg.Creator.createNode(type, randomPos(), '');
                    editor.scene.appendNode(model_node);
                    editor.scene.objects[addr] = model_node;
                    model_node.setScAddr(addr);
                    if (addrNodeorLink) {
                        model_node.setScaleElem(addrNodeorLink.node);
                        model_node.setOpacityElem(addrNodeorLink.opacity);
                        model_node.setStrokeElem(addrNodeorLink.stroke);
                        model_node.setFillElem(addrNodeorLink.fill);
                    }
                    model_node.setObjectState(SCgObjectState.FromMemory);
                    resolveIdtf(addr, model_node);
                } else if (type & sc_type_arc_mask) {
                    var bObj = editor.scene.getObjectByScAddr(addrNodeorLink);
                    var eObj = editor.scene.getObjectByScAddr(addrElemEdgeEnd);
                    if (!bObj || !eObj) {
                        tasks.push(task);
                    } else {
                        var model_edge = SCg.Creator.createEdge(bObj, eObj, type);
                        editor.scene.appendEdge(model_edge);
                        editor.scene.objects[addr] = model_edge;
                        model_edge.setScAddr(addr);
                        if (addrEdge) {
                            model_edge.setOpacityElem(addrEdge.opacity);
                            model_edge.setWidthEdge(addrEdge.widthEdge);
                            model_edge.setStrokeElem(addrEdge.stroke);
                            model_edge.setFillElem(addrEdge.fill);
                        }
                        model_edge.setObjectState(SCgObjectState.FromMemory);
                    }
                } else if (type & sc_type_link) {
                    var containerId = 'scg-window-' + sandbox.addr + '-' + addr + '-' + new Date().getUTCMilliseconds();
                    var model_link = SCg.Creator.createLink(sc_type_link, randomPos(), containerId);
                    editor.scene.appendLink(model_link);
                    editor.scene.objects[addr] = model_link;
                    model_link.setScAddr(addr);
                    if (addrNodeorLink) {
                        model_link.setScaleElem(addrNodeorLink.link);
                        model_link.setOpacityElem(addrNodeorLink.opacity);
                        model_link.setStrokeElem(addrNodeorLink.stroke);
                        model_link.setFillElem(addrNodeorLink.fill);
                        model_link.setObjectState(SCgObjectState.FromMemory);
                    }
                    resolveIdtf(addr, model_link);
                }

            }
            editor.render.update();
            editor.scene.layout();

            batch = null;
        }
    };

    var addTask = function (args) {
        debouncedClearTimer();
        tasks.push(args);
        if (!self.timeout) {
            self.timeout = window.setInterval(doBatch, 10);
        }
        doBatch();
    };

    var removeElement = function (addr) {
        var obj = editor.scene.getObjectByScAddr(addr);
        if (obj)
            editor.scene.deleteObjects([obj]);
        editor.render.update();
        editor.scene.layout();
    };

    let getArc = async (arc) => {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            [sc.ScType.Unknown, "src"],
            new sc.ScAddr(arc),
            [sc.ScType.Unknown, "target"]
        );
        let result = await scClient.templateSearch(scTemplate);
        return [result[0].get("src").value, result[0].get("target").value];
    };

    let getElementType = async (el) => {
        return (await scClient.checkElements([new sc.ScAddr(el)]))[0].value;
    };

    return {
        update: async function (added, element, arc, scaleElem) {

            if (added) {
                let [_, el] = await getArc(arc);
                let t = await getElementType(el);
                arcMapping[arc] = el;
                if (t & (sc_type_node | sc_type_link)) {
                    addTask([el, t, scaleElem]);
                } else if (t & sc_type_arc_mask) {
                    let [src, target] = await getArc(el);
                    addTask([el, t, src, target, scaleElem]);
                } else
                    throw "Unknown element type " + t;
            } else {
                var e = arcMapping[arc];
                if (e)
                    removeElement(e);
            }
        }
    };

}

// ----------------------------------------------------------------------

//! TODO: refactoring
function scgScStructTranslator(_editor, _sandbox) {
    var r, editor = _editor,
        sandbox = _sandbox,
        tasks = [],
        processBatch = false,
        taskDoneCount = 0,
        arcMapping = {};

    if (!sandbox.is_struct)
        throw "Sandbox must to work with sc-struct";

    var scgFromSc = new ScgFromScImpl(sandbox, editor, arcMapping);

    var appendToConstruction = async function (obj) {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            new sc.ScAddr(sandbox.addr),
            [sc.ScType.EdgeAccessVarPosPerm, 'arc'],
            new sc.ScAddr(obj.sc_addr)
        );
        let result = await scClient.templateGenerate(scTemplate);
        arcMapping[result.get('arc').value] = obj;
    };

    var translateIdentifier = async function (obj) {
        let scAddr = new sc.ScAddr(obj.sc_addr);
        // Checks if identifier is allowed to be system identifier (only letter, digits, '-' and '_')
        if (/^[a-zA-Z0-9_-]+$/.test(obj.text)) {
            let systemIdtfTemplate = new sc.ScTemplate();
            systemIdtfTemplate.tripleWithRelation(
                scAddr,
                sc.ScType.EdgeDCommonVar,
                [sc.ScType.LinkVar, 'link'],
                sc.ScType.EdgeAccessVarPosPerm,
                new sc.ScAddr(window.scKeynodes['nrel_system_identifier'])
            );
            let systemIdtfResult = await scClient.templateGenerate(systemIdtfTemplate);
            let systemIdtfAddr = systemIdtfResult.get('link');
            await scClient.setLinkContents([new sc.ScLinkContent(obj.text, sc.ScLinkContentType.String, systemIdtfAddr)]);
        }
        else {
            let scTemplate = new sc.ScTemplate();
            scTemplate.tripleWithRelation(
                scAddr,
                sc.ScType.EdgeDCommonVar,
                [sc.ScType.LinkVar, 'link'],
                sc.ScType.EdgeAccessVarPosPerm,
                new sc.ScAddr(window.scKeynodes['nrel_main_idtf'])
            );
            let result = await scClient.templateGenerate(scTemplate);
            let linkAddr = result.get('link');
            await scClient.setLinkContents([new sc.ScLinkContent(obj.text, sc.ScLinkContentType.String, linkAddr)]);
        }
    };

    return r = {
        updateFromSc: function (added, element, arc, scaleElem) {
            scgFromSc.update(added, element, arc, scaleElem);
        },

        translateToSc: async function (callback) {
            if (!sandbox.is_struct)
                throw "Invalid state. Trying translate sc-link into sc-memory";

            editor.scene.commandManager.clear();
            var nodes = editor.scene.nodes.slice();
            var links = editor.scene.links.slice();
            var buses = editor.scene.buses.slice();
            var objects = [];


            var appendObjects = function () {
                Promise.all(objects.map(appendToConstruction))
                    .then(() => callback(true))
                    .catch(() => callback(false));
            };

            function fireCallback() {
                editor.render.update();
                editor.scene.layout();
                appendObjects();
            }


            /// --------------------
            var translateNodes = async function () {
                var implFunc = async function (node) {
                    if (node.sc_addr) {
                        return;
                    }

                    if (node.text) {
                        let linkAddrs = await scClient.getLinksByContents([node.text]);
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

                    let scConstruction = new sc.ScConstruction();
                    scConstruction.createNode(new sc.ScType(node.sc_type), "node");
                    let result = await scClient.createElements(scConstruction);
                    node.setScAddr(result[scConstruction.getIndex("node")].value);
                    node.setObjectState(SCgObjectState.NewInMemory);
                    objects.push(node);
                    if (node.text) {
                        await translateIdentifier(node);
                    }
                }
                return Promise.all(nodes.map(implFunc));
            }

            var preTranslateContoursAndBus = async function () {
                // create sc-struct nodes
                var scAddrGen = async function (c) {
                    if (c.sc_addr)
                        return;
                    let scConstruction = new sc.ScConstruction();
                    scConstruction.createNode(sc.ScType.NodeConstStruct, 'node');
                    let result = await scClient.createElements(scConstruction);
                    let node = result[scConstruction.getIndex('node')].value;
                    c.setScAddr(node);
                    c.setObjectState(SCgObjectState.NewInMemory);
                    objects.push(c);
                    if (c.text) {
                        await translateIdentifier(c);
                    }
                };
                var funcs = [];
                for (var i = 0; i < editor.scene.contours.length; ++i) {
                    editor.scene.contours[i].addNodesWhichAreInContourPolygon(editor.scene.nodes);
                    editor.scene.contours[i].addNodesWhichAreInContourPolygon(editor.scene.links);
                    editor.scene.contours[i].addEdgesWhichAreInContourPolygon(editor.scene.edges);
                    funcs.push(scAddrGen(editor.scene.contours[i]));
                }

                for (var number_bus = 0; number_bus < buses.length; ++number_bus) {
                    buses[number_bus].setScAddr(buses[number_bus].source.sc_addr);
                }

                // run tasks
                return Promise.all(funcs);
            }

            /// --------------------
            var translateEdges = function () {
                return new Promise((resolve, reject) => {
                    // translate edges
                    var edges = [];
                    editor.scene.edges.map(function (e) {
                        if (!e.sc_addr)
                            edges.push(e);
                    });

                    var edgesNew = [];
                    var translatedCount = 0;

                    async function doIteration() {
                        var edge = edges.shift();

                        function nextIteration() {
                            if (edges.length === 0) {
                                if (translatedCount === 0 || (edges.length === 0 && edgesNew.length === 0))
                                    resolve();
                                else {
                                    edges = edgesNew;
                                    edgesNew = [];
                                    translatedCount = 0;
                                    window.setTimeout(doIteration, 0);
                                }
                            } else
                                window.setTimeout(doIteration, 0);
                        }

                        if (edge.sc_addr)
                            reject("Edge already have sc-addr");

                        var src = edge.source.sc_addr;
                        var trg = edge.target.sc_addr;

                        if (src && trg) {
                            let scConstruction = new sc.ScConstruction();
                            scConstruction.createEdge(new sc.ScType(edge.sc_type), new sc.ScAddr(src), new sc.ScAddr(trg), 'edge');
                            let result = await scClient.createElements(scConstruction);
                            edge.setScAddr(result[scConstruction.getIndex('edge')].value);
                            edge.setObjectState(SCgObjectState.NewInMemory);
                            objects.push(edge);
                            translatedCount++;
                            nextIteration();
                        } else {
                            edgesNew.push(edge);
                            nextIteration();
                        }

                    }

                    if (edges.length > 0)
                        window.setTimeout(doIteration, 0);
                    else
                        resolve();

                });
            }

            var translateContours = async function () {
                // now need to process arcs from countours to child elements
                var arcGen = async function (contour, child) {
                    let edgeExist = await window.scHelper.checkEdge(contour.sc_addr, sc_type_arc_pos_const_perm, child.sc_addr);
                    if (!edgeExist) {
                        let scConstruction = new sc.ScConstruction();
                        scConstruction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(contour.sc_addr), new sc.ScAddr(child.sc_addr), 'edge');
                        await scClient.createElements(scConstruction);
                    }
                };

                var acrFuncs = [];
                for (var i = 0; i < editor.scene.contours.length; ++i) {
                    var c = editor.scene.contours[i];
                    for (var j = 0; j < c.childs.length; ++j) {
                        acrFuncs.push(arcGen(c, c.childs[j]));
                    }
                }
                return Promise.all(acrFuncs);
            }

            /// --------------------
            var translateLinks = async function () {
                var implFunc = async function (link) {
                    const infoConstruction = (link) => {
                        let data = link.content;
                        let type = sc.ScLinkContentType.String;
                        let langKeynode = SCWeb.core.Translation.getCurrentLanguage();

                        let keynode;
                        if (link.contentType === 'float') {
                            keynode = window.scKeynodes['binary_float'];
                            type = sc.ScLinkContentType.Float;
                        } else if (link.contentType === 'int8') {
                            type = sc.ScLinkContentType.Int;
                            keynode = window.scKeynodes['binary_int8'];
                        } else if (link.contentType === 'int16') {
                            type = sc.ScLinkContentType.Int;
                            keynode = window.scKeynodes['binary_int16'];
                        } else if (link.contentType === 'int32') {
                            type = sc.ScLinkContentType.Int;
                            keynode = window.scKeynodes['binary_int32'];
                        } else if (link.contentType === 'image') {
                            keynode = window.scKeynodes['format_png'];
                        } else if (link.contentType === 'html') {
                            keynode = window.scKeynodes['format_html'];
                        } else if (link.contentType === 'pdf') {
                            keynode = window.scKeynodes['format_pdf'];
                        }
                        return { data, type, keynode, langKeynode };
                    }

                    // Find link from kb by system identifier
                    if (!link.sc_addr && link.text) {
                        let linkSystemIdentifierAddrs = await scClient.getLinksByContents([link.text]);
                        if (linkSystemIdentifierAddrs.length) {
                            linkSystemIdentifierAddrs = linkSystemIdentifierAddrs[0];
                            if (linkSystemIdentifierAddrs.length) {
                                let linkFromKb = await window.scHelper.searchNodeByIdentifier(linkSystemIdentifierAddrs[0], window.scKeynodes['nrel_system_identifier']);
                                link.setScAddr(linkFromKb.value);
                                link.setObjectState(SCgObjectState.FromMemory);
                                objects.push(link);
                            }
                        }
                    }

                    // Create new link
                    if (!link.sc_addr) {
                        let scConstruction = new sc.ScConstruction();
                        const { data, type, keynode } = infoConstruction(link);
                        let scLinkContent = new sc.ScLinkContent(data, type);
                        scConstruction.createLink(sc.ScType.Link, scLinkContent, 'link');
                        let result = await scClient.createElements(scConstruction);
                        let linkAddr = result[scConstruction.getIndex('link')].value;
                        link.setScAddr(linkAddr);
                        link.setObjectState(SCgObjectState.NewInMemory);
                        objects.push(link);
                        if (link.text) {
                            await translateIdentifier(link);
                        }
                        if (link.content) {
                            await window.scHelper.setLinkFormat(linkAddr, keynode);
                        }
                    }
                }

                var funcs = [];
                for (let i = 0; i < links.length; ++i) {
                    funcs.push(implFunc(links[i]));
                }
                return Promise.all(funcs);
            }

            await translateNodes();
            await translateLinks();
            await preTranslateContoursAndBus();
            await translateEdges();
            await translateContours();
            fireCallback();
        }
    };
}
