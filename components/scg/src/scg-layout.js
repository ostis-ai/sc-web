const SCgLayoutObjectType = {
    Node: 0,
    Edge: 1,
    Link: 2,
    Contour: 3,
    DotPoint: 4
};

// Layout algorithms


/**
 * Base layout algorithm
 */
SCg.LayoutAlgorithm = function (nodes, edges, contours, onTickUpdate) {
    this.nodes = nodes;
    this.edges = edges;
    this.contours = contours;
    this.onTickUpdate = onTickUpdate;
};

SCg.LayoutAlgorithm.prototype = {
    constructor: SCg.LayoutAlgorithm
};

// --------------------------

SCg.LayoutAlgorithmForceBased = function (nodes, edges, contours, onTickUpdate, rect) {
    SCg.LayoutAlgorithm.call(this, nodes, edges, contours, onTickUpdate);
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
        .links(this.edges)
        .size(this.rect)
        .friction(0.75)
        .gravity(0.03)
        .linkDistance(function (edge) {
            const p1 = edge.source.object.getConnectionPos(edge.target.object.position, edge.object.source_dot);
            const p2 = edge.target.object.getConnectionPos(edge.source.object.position, edge.object.target_dot);
            const cd = edge.source.object.position.clone().sub(edge.target.object.position).length();
            const d = cd - p1.sub(p2).length();

            if (edge.source.type == SCgLayoutObjectType.DotPoint ||
                edge.target.type == SCgLayoutObjectType.DotPoint) {
                return d + 50;
            }

            return 100 + d;
        })
        .linkStrength(function (edge) {
            if (edge.source.type == SCgLayoutObjectType.DotPoint ||
                edge.target.type == SCgLayoutObjectType.DotPoint) {
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

        let edge = dot.object.target;
        if (dot.source)
            edge = dot.object.source;

        dot.x = edge.position.x;
        dot.y = edge.position.y;
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
    this.edges = null;

    this.algorithm = null;
};

/**
 * Prepare objects for layout
 */
SCg.LayoutManager.prototype.prepareObjects = function () {
    this.nodes = {};
    this.edges = {};
    let objDict = {};

    this.nodes[0] = [];
    this.edges[0] = [];

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

    for (let idx in this.scene.edges) {
        const edge = this.scene.edges[idx];

        let obj = {};
        obj.object = edge;
        obj.type = SCgLayoutObjectType.Edge;
        obj.contour = edge.contour;

        objDict[edge.id] = obj;

        appendElement(obj, this.edges);
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

    // store begin and end for edges
    for (let key in this.edges) {
        const edges = this.edges[key];
        for (let idx in edges) {
            const edge = edges[idx];

            let source = objDict[edge.object.source.id];
            let target = objDict[edge.object.target.id];

            function getEdgeObj(srcObj, isSource) {
                if (srcObj.type === SCgLayoutObjectType.Edge) {
                    let obj = {};
                    obj.type = SCgLayoutObjectType.DotPoint;
                    obj.object = srcObj.object;
                    obj.source = isSource;

                    return obj;
                }
                return srcObj;
            }

            edge.source = getEdgeObj(source, true);
            edge.target = getEdgeObj(target, false);

            if (edge.source !== source)
                appendElement(edge.source, this.nodes);
            if (edge.target !== target)
                appendElement(edge.target, this.nodes);
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
    this.algorithm = new SCg.LayoutAlgorithmForceBased(this.nodes[0], this.edges[0], null,
        $.proxy(this.onTickUpdate, this),
        this.scene.getContainerSize());
    this.algorithm.start();
};

SCg.LayoutManager.prototype.onTickUpdate = function () {
    this.scene.updateObjectsVisual();
    this.scene.pointed_object = null;
};
