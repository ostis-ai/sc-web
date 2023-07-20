const SCgStructFromScTranslatorImpl = function (_editor, _sandbox) {
    let arcMapping = {},
        tasks = {},
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

    const doBatch = function () {
        for (let i in tasks) {
            const task = tasks[i];
            const addr = task[0];
            const type = task[1];
            let addrNodeorLink = task[2];
            let addrEdge = task[4];
            let addrElemEdgeEnd = task[3];

            if (!addrNodeorLink && sandbox.mainElement) addrNodeorLink = { node: 1.8, link: 1.5, opacity: 1, widthEdge: 7.5, stroke: '#1E90FF', fill: '#1E90FF' };
            if (!addrEdge && sandbox.mainElement) addrEdge = { node: 1.8, link: 1.5, opacity: 1, widthEdge: 7.5, stroke: '#1E90FF', fill: '#1E90FF' };

            let newMainNode = editor.scene.getObjectByScAddr(addr);
            if (newMainNode) {
                if (sandbox.mainElement) {
                    if (newMainNode instanceof SCg.ModelEdge) {
                        newMainNode.setOpacityElem(addrEdge.opacity);
                        newMainNode.setWidthEdge(addrEdge.widthEdge);
                        newMainNode.setStrokeElem(addrEdge.stroke);
                        newMainNode.setFillElem(addrEdge.fill);
                    }
                    if (newMainNode instanceof SCg.ModelNode) {
                        newMainNode.setScaleElem(addrNodeorLink.node);
                        newMainNode.setOpacityElem(addrNodeorLink.opacity);
                        newMainNode.setStrokeElem(addrNodeorLink.stroke);
                        newMainNode.setFillElem(addrNodeorLink.fill);
                    }
                    if (newMainNode instanceof SCg.ModelLink) {
                        newMainNode.setScaleElem(addrNodeorLink.link);
                        newMainNode.setOpacityElem(addrNodeorLink.opacity);
                        newMainNode.setStrokeElem(addrNodeorLink.stroke);
                        newMainNode.setFillElem(addrNodeorLink.fill);
                    }
                }
                continue;
            }

            if (type & sc_type_node) {
                let model_node = SCg.Creator.createNode(type, randomPos(), '');
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
                const bObj = editor.scene.getObjectByScAddr(addrNodeorLink);
                const eObj = editor.scene.getObjectByScAddr(addrElemEdgeEnd);
                if (bObj && eObj) {
                    let model_edge = SCg.Creator.createEdge(bObj, eObj, type);
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
                const containerId = 'scg-window-' + sandbox.addr + '-' + addr + '-' + new Date().getUTCMilliseconds();
                let model_link = SCg.Creator.createLink(sc_type_link, randomPos(), containerId);
                editor.scene.appendLink(model_link);
                editor.scene.objects[addr] = model_link;
                model_link.setScAddr(addr);
                if (addrNodeorLink) {
                    model_link.setScaleElem(addrNodeorLink.link);
                    model_link.setOpacityElem(addrNodeorLink.opacity);
                    model_link.setStrokeElem(addrNodeorLink.stroke);
                    model_link.setFillElem(addrNodeorLink.fill);
                }
                model_link.setObjectState(SCgObjectState.FromMemory);
                resolveIdtf(addr, model_link);
            }

        }
        editor.render.update();
        editor.scene.layout();
    };

    const addTask = function (arc, args) {
        tasks[arc] = args;
        doBatch();
    };

    const removeElement = function (addr) {
        const obj = editor.scene.getObjectByScAddr(addr);
        if (obj) {
            editor.render.updateRemovedObjects([obj]);
            editor.scene.deleteObjects([obj]);
        }
        editor.render.update();
        editor.scene.layout();
    };

    const getArc = async (arc) => {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            [sc.ScType.Unknown, "src"],
            new sc.ScAddr(arc),
            [sc.ScType.Unknown, "target"]
        );
        let result = await scClient.templateSearch(scTemplate);
        return [result[0].get("src").value, result[0].get("target").value];
    };

    const getElementType = async (el) => {
        return (await scClient.checkElements([new sc.ScAddr(el)]))[0].value;
    };

    return {
        update: async function (added, element, arc, scaleElem) {
            if (added) {
                let [_, el] = await getArc(arc);
                let t = await getElementType(el);
                arcMapping[arc] = el;
                if (t & (sc_type_node | sc_type_link)) {
                    addTask(arc, [el, t, scaleElem]);
                } else if (t & sc_type_arc_mask) {
                    let [src, target] = await getArc(el);
                    addTask(arc, [el, t, src, target, scaleElem]);
                } else
                    throw "Unknown element type " + t;
            } else {
                const e = arcMapping[arc];
                if (e) {
                    removeElement(e);
                    delete tasks[arc];
                }
            }
        }
    };
}

const SCgStructToScTranslatorImpl = function (_editor, _sandbox) {
    let editor = _editor,
        sandbox = _sandbox,
        arcMapping = {},
        objects = [];

    const appendToConstruction = async function (obj) {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            new sc.ScAddr(sandbox.addr),
            [sc.ScType.EdgeAccessVarPosPerm, 'arc'],
            new sc.ScAddr(obj.sc_addr)
        );
        let result = await scClient.templateGenerate(scTemplate);
        arcMapping[result.get('arc').value] = obj;
    };

    const translateIdentifier = async function (obj) {
        const LINK = 'link';
        const objectAddr = new sc.ScAddr(obj.sc_addr);

        // Checks if identifier is allowed to be system identifier (only letter, digits, '-' and '_')
        const idtfRelation = /^[a-zA-Z0-9_-]+$/.test(obj.text)
            ? new sc.ScAddr(window.scKeynodes['nrel_system_identifier'])
            : new sc.ScAddr(window.scKeynodes['nrel_main_idtf']);

        let template = new sc.ScTemplate();
        template.tripleWithRelation(
            objectAddr,
            sc.ScType.EdgeDCommonVar,
            [sc.ScType.LinkVar, LINK],
            sc.ScType.EdgeAccessVarPosPerm,
            idtfRelation
        );
        let result = await scClient.templateSearch(template);

        let idtfLinkAddr;
        if (result.length) {
            idtfLinkAddr = result[0].get(LINK);
        }
        else {
            result = await scClient.templateGenerate(template);
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

            if (!node.sc_addr) {
                let scConstruction = new sc.ScConstruction();
                scConstruction.createNode(new sc.ScType(node.sc_type), "node");
                let result = await scClient.createElements(scConstruction);
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

    const preTranslateContoursAndBus = async function (nodes, links, edges, contours, buses) {
        // create sc-struct nodes
        const scAddrGen = async function (c) {
            if (!c.sc_addr) {
                let scConstruction = new sc.ScConstruction();
                scConstruction.createNode(sc.ScType.NodeConstStruct, 'node');
                let result = await scClient.createElements(scConstruction);
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
            contours[i].addEdgesWhichAreInContourPolygon(edges);
            funcs.push(scAddrGen(contours[i]));
        }

        for (let number_bus = 0; number_bus < buses.length; ++number_bus) {
            buses[number_bus].setScAddr(buses[number_bus].source.sc_addr);
        }

        // run tasks
        return Promise.all(funcs);
    }

    const translateEdges = function (edges) {
        return new Promise((resolve, reject) => {
            edges = edges.filter(e => !e.sc_addr);

            let edgesNew = [];
            let translatedCount = 0;

            async function doIteration() {
                const edge = edges.shift();

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

                const src = edge.source.sc_addr;
                const trg = edge.target.sc_addr;

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

    const translateContours = async function (contours) {
        // now need to process arcs from contours to child elements
        const arcGen = async function (contour, child) {
            let edgeExist = await window.scHelper.checkEdge(contour.sc_addr, sc_type_arc_pos_const_perm, child.sc_addr);
            if (!edgeExist) {
                let scConstruction = new sc.ScConstruction();
                scConstruction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(contour.sc_addr), new sc.ScAddr(child.sc_addr), 'edge');
                await scClient.createElements(scConstruction);
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
                let linkSystemIdentifierAddrs = await scClient.getLinksByContents([link.text]);
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
                construction.createLink(sc.ScType.Link, linkContent, 'link');
                const result = await scClient.createElements(construction);
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
            const edges = editor.scene.edges.slice();
            const contours = editor.scene.contours.slice();
            const buses = editor.scene.buses.slice();

            await translateNodes(nodes);
            await translateLinks(links);
            await preTranslateContoursAndBus(nodes, links, edges, contours, buses);
            await translateEdges(edges);
            await translateContours(contours);
            await fireCallback();
        }
    }
}

function SCgStructTranslator(_editor, _sandbox) {
    const fromScTranslator = new SCgStructFromScTranslatorImpl(_editor, _sandbox);
    const toScTranslator = new SCgStructToScTranslatorImpl(_editor, _sandbox);

    return {
        updateFromSc: async function (added, element, arc, scaleElem) {
            await fromScTranslator.update(added, element, arc, scaleElem);
        },

        translateToSc: async function () {
            await toScTranslator.update();
        }
    };
}
