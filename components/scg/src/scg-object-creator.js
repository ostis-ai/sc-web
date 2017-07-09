SCg.Creator = {};

/**
 * Create new node
 * @param {Integer} sc_type Type of node
 * @param {SCg.Vector3} pos Position of node
 * @param {String} text Text assotiated with node
 *
 * @return SCg.ModelNode created node
 */
SCg.Creator.createNode = function (sc_type, pos, text) {
    return new SCg.ModelNode({
        position: pos.clone(),
        scale: new SCg.Vector2(20, 20),
        sc_type: sc_type,
        text: text
    });
};

SCg.Creator.createLink = function (pos, containerId) {
    var link = new SCg.ModelLink({
        position: pos.clone(),
        scale: new SCg.Vector2(50, 50),
        sc_type: sc_type_link,
        containerId: containerId
    });
    link.setContent("");
    return link;
};

/**
 * Create edge between two specified objects
 * @param {SCg.ModelObject} source Edge source object
 * @param {SCg.ModelObject} target Edge target object
 * @param {Integer} sc_type SC-type of edge
 *
 * @return SCg.ModelEdge created edge
 */
SCg.Creator.createEdge = function (source, target, sc_type) {
    return new SCg.ModelEdge({
        source: source,
        target: target,
        sc_type: sc_type ? sc_type : sc_type_edge_common
    });
};

SCg.Creator.createBus = function (source) {
    return new SCg.ModelBus({
        source: source
    });
};

SCg.Creator.createCounter = function (polygon) {
    return new SCg.ModelContour({
        verticies: polygon
    });
};
