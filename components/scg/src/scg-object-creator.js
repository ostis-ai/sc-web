SCg.Creator = {};

/**
 * Create new node
 * @param {Integer} sc_type Type of node
 * @param {SCg.Vector3} pos Position of node
 * @param {String} text Text assotiated with node
 *
 * @return SCg.ModelNode created node
 */
SCg.Creator.generateNode = function (sc_type, pos, text) {
    return new SCg.ModelNode({
        position: pos.clone(),
        scale: new SCg.Vector2(20, 20),
        sc_type: sc_type,
        text: text
    });
};

SCg.Creator.generateLink = function (sc_type, pos, containerId, text) {
    var link = new SCg.ModelLink({
        position: pos.clone(),
        scale: new SCg.Vector2(50, 50),
        sc_type: sc_type,
        containerId: containerId,
        text: text
    });
    link.setContent("");
    return link;
};

/**
 * Create connector between two specified objects
 * @param {SCg.ModelObject} source Connector source object
 * @param {SCg.ModelObject} target Connector target object
 * @param {Integer} sc_type SC-type of connector
 *
 * @return SCg.ModelConnector created connector
 */
SCg.Creator.generateConnector = function (source, target, sc_type) {
    return new SCg.ModelConnector({
        source: source,
        target: target,
        sc_type: sc_type ? sc_type : sc_type_common_edge
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
