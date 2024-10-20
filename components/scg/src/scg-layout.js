const SCgLayoutObjectType = {
    Node: 0,
    Connector: 1,
    Link: 2,
    Contour: 3,
    DotPoint: 4
};

// Layout algorithms


/**
 * Base layout algorithm
 */
SCg.LayoutAlgorithm = function (nodes, connectors, contours, onTickUpdate) {
    this.nodes = nodes;
    this.connectors = connectors;
    this.contours = contours;
    this.onTickUpdate = onTickUpdate;
};

SCg.LayoutAlgorithm.prototype = {
    constructor: SCg.LayoutAlgorithm
};

// --------------------------

SCg.LayoutAlgorithmForceBased = function (nodes, connectors, contours, onTickUpdate, rect) {
    SCg.LayoutAlgorithm.call(this, nodes, connectors, contours, onTickUpdate);
    this.rect = rect;
};

SCg.LayoutAlgorithmForceBased.prototype = Object.create(SCg.LayoutAlgorithm);

SCg.LayoutAlgorithmForceBased.prototype.destroy = function () {
    this.stop();
};

SCg.LayoutAlgorithmForceBased.prototype.stop = function () {
    if (this.force) {
        this.force.stop();
        delete this.force;
        this.force = null;
    }

};

SCg.LayoutAlgorithmForceBased.prototype.start = function () {
    this.stop();

    // init D3 force layout
    let self = this;

    this.force = d3.layout.force()
        .nodes(this.nodes)
        .links(this.connectors)
        .size(this.rect)
        .friction(0.75)
        .gravity(0.03)
        .linkDistance(function (connector) {
            const p1 = connector.source.object.getConnectionPos(connector.target.object.position, connector.object.source_dot);
            const p2 = connector.target.object.getConnectionPos(connector.source.object.position, connector.object.target_dot);
            const cd = connector.source.object.position.clone().sub(connector.target.object.position).length();
            const d = cd - p1.sub(p2).length();

            if (connector.source.type == SCgLayoutObjectType.DotPoint ||
                connector.target.type == SCgLayoutObjectType.DotPoint) {
                return d + 50;
            }

            return 100 + d;
        })
        .linkStrength(function (connector) {
            if (connector.source.type == SCgLayoutObjectType.DotPoint ||
                connector.target.type == SCgLayoutObjectType.DotPoint) {
                return 1;
            }

            return 0.3;
        })
        .charge(function (node) {
            if (node.type == SCgLayoutObjectType.DotPoint) {
                return 0;
            } else if (node.type == SCgLayoutObjectType.Link) {
                return -900;
            }

            return -700;
        })
        .on('tick', function () {
            self.onLayoutTick();
        })
        .start();
};

SCg.LayoutAlgorithmForceBased.prototype.onLayoutTick = function () {
    let dots = [];
    for (let idx in this.nodes) {
        const node_layout = this.nodes[idx];

        if (node_layout.type === SCgLayoutObjectType.Node) {
            node_layout.object.setPosition(new SCg.Vector3(node_layout.x, node_layout.y, 0));
        } else if (node_layout.type === SCgLayoutObjectType.Link) {
            node_layout.object.setPosition(new SCg.Vector3(node_layout.x, node_layout.y, 0));
        } else if (node_layout.type === SCgLayoutObjectType.DotPoint) {
            dots.push(node_layout);
        } else if (node_layout.type === SCgLayoutObjectType.Contour) {
            node_layout.object.setPosition(new SCg.Vector3(node_layout.x, node_layout.y, 0));
        }
    }

    // setup dot points positions 
    for (let idx in dots) {
        const dot = dots[idx];

        let connector = dot.object.target;
        if (dot.source)
            connector = dot.object.source;

        dot.x = connector.position.x;
        dot.y = connector.position.y;
    }

    this.onTickUpdate();
};


// ------------------------------------

SCg.LayoutManager = function () {

};

SCg.LayoutManager.prototype = {
    constructor: SCg.LayoutManager
};

SCg.LayoutManager.prototype.init = function (scene) {
    this.scene = scene;
    this.nodes = null;
    this.connectors = null;

    this.algorithm = null;
};

/**
 * Prepare objects for layout
 */
SCg.LayoutManager.prototype.prepareObjects = function () {
    this.nodes = {};
    this.connectors = {};
    let objDict = {};

    this.nodes[0] = [];
    this.connectors[0] = [];

    const appendElement = (element, elements) => {
        const contour = element.contour ? element.contour.sc_addr : 0;
        if (!elements[contour]) {
            elements[contour] = [];
        }

        elements[contour].push(element);
    }

    // first of all we need to collect objects from scene, and build them representation for layout
    for (let idx in this.scene.nodes) {
        const node = this.scene.nodes[idx];

        let obj = {};
        obj.x = node.position.x;
        obj.y = node.position.y;
        obj.object = node;
        obj.type = SCgLayoutObjectType.Node;
        obj.contour = node.contour;

        objDict[node.id] = obj;

        appendElement(obj, this.nodes);
    }

    for (let idx in this.scene.links) {
        const link = this.scene.links[idx];

        let obj = {};
        obj.x = link.position.x;
        obj.y = link.position.y;
        obj.object = link;
        obj.type = SCgLayoutObjectType.Link;
        obj.contour = link.contour;

        objDict[link.id] = obj;

        appendElement(obj, this.nodes);
    }

    for (let idx in this.scene.connectors) {
        const connector = this.scene.connectors[idx];

        let obj = {};
        obj.object = connector;
        obj.type = SCgLayoutObjectType.Connector;
        obj.contour = connector.contour;

        objDict[connector.id] = obj;

        appendElement(obj, this.connectors);
    }

    for (let idx in this.scene.contours) {
        const contour = this.scene.contours[idx];

        let obj = {};
        obj.x = contour.position.x;
        obj.y = contour.position.y;
        obj.object = contour;
        obj.type = SCgLayoutObjectType.Contour;

        objDict[contour.id] = obj;

        appendElement(obj, this.nodes);
    }

    // store begin and end for connectors
    for (let key in this.connectors) {
        const connectors = this.connectors[key];
        for (let idx in connectors) {
            const connector = connectors[idx];

            let source = objDict[connector.object.source.id];
            let target = objDict[connector.object.target.id];

            function getConnectorObj(connector, srcObj, isSource) {
                if (srcObj.type === SCgLayoutObjectType.Connector) {
                    let obj = {};
                    obj.type = SCgLayoutObjectType.DotPoint;
                    obj.object = srcObj.object;
                    obj.source = isSource;

                    return obj;
                }

                if (!connector.contour) {
                    if (!srcObj.contour) return srcObj;

                    do {
                        srcObj = srcObj.contour;
                    } while (srcObj.contour);
                    return objDict[srcObj.id];
                }

                return srcObj;
            }

            connector.source = getConnectorObj(connector, source, true);
            connector.target = getConnectorObj(connector, target, false);

            if (connector.source !== source)
                appendElement(connector.source, this.nodes);
            if (connector.target !== target)
                appendElement(connector.target, this.nodes);
        }
    }
};

/**
 * Starts layout in scene
 */
SCg.LayoutManager.prototype.doLayout = function () {
    if (this.algorithm) {
        this.algorithm.stop();
        delete this.algorithm;
    }

    this.prepareObjects();
    this.algorithm = new SCg.LayoutAlgorithmForceBased(this.nodes[0], this.connectors[0], null,
        $.proxy(this.onTickUpdate, this),
        this.scene.getContainerSize());
    this.algorithm.start();
};

SCg.LayoutManager.prototype.onTickUpdate = function () {
    this.scene.updateObjectsVisual();
    this.scene.pointed_object = null;
};
