const GwfObjectController = {
    x_offset: 0,
    y_offset: 0,

    fixOffsetOfPoints: function (args) {
        var x = parseFloat(args.x);
        var y = parseFloat(args.y);

        if (x < this.x_offset)
            this.x_offset = x;

        if (y < this.y_offset)
            this.y_offset = y;
    },

    getXOffset: function () {
        return Math.abs(this.x_offset) + 60;
    },

    getYOffset: function () {
        return Math.abs(this.y_offset) + 30;
    }
}

var GwfObject = function (args) {

    this.id = -1;
    this.attributes = {};
    this.required_attrs = [];
    this.optional_attrs = ["sc_addr"];

}

GwfObject.prototype = {
    constructor: GwfObject
}

GwfObject.prototype.parseObject = function (args) {

}

GwfObject.prototype.buildObject = function (args) {

}


GwfObject.prototype.parsePoints = function (args) {
    var gwf_object = args.gwf_object;
    var reader = args.reader;

    var points = gwf_object.getElementsByTagName("points")[0].getElementsByTagName("point");
    this.attributes.points = [];
    for (var i = 0; i < points.length; i++) {
        var point = reader.fetchAttributes(points[i], ["x", "y"]);
        this.attributes.points.push(point);
        GwfObjectController.fixOffsetOfPoints({x: point["x"], y: point["y"]});
    }
}

GwfObject.prototype.fixParent = function (args) {
    const parent = this.attributes["parent"];

    if (parent !== "0") {
        let parent_object = args.builder.getOrCreate(parent);
        parent_object.addChild(args.scg_object);
        args.scg_object.update();
        parent_object.update();
    }
}


var GwfObjectNode = function (args) {

    GwfObject.call(this, args);
    this.required_attrs = ["id", "type", "x", "y", "parent", "idtf"];
}

GwfObjectNode.prototype = Object.create(GwfObject.prototype);

// have to specify node and reader
GwfObjectNode.prototype.parseObject = function (args) {
    var node = args.gwf_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(node, this.required_attrs, this.optional_attrs);

    if (this.attributes == false)
        return false;


    //fix some attrs
    this.attributes["type"] = reader.getTypeCode(this.attributes.type);
    this.attributes["x"] = parseFloat(this.attributes["x"]);
    this.attributes["y"] = parseFloat(this.attributes["y"]);

    //fixing points
    GwfObjectController.fixOffsetOfPoints({x: this.attributes["x"], y: this.attributes["y"]});

    this.id = this.attributes["id"];
    return this;
}

// have to specify scene,builder
GwfObjectNode.prototype.buildObject = function (args) {
    var scene = args.scene;
    var node = SCg.Creator.generateNode(this.attributes["type"], new SCg.Vector3(this.attributes["x"] + GwfObjectController.getXOffset(), this.attributes["y"] + GwfObjectController.getYOffset(), 0), this.attributes["idtf"]);
    if (this.attributes.hasOwnProperty("sc_addr"))
        node.sc_addr = this.attributes.sc_addr;
    scene.appendNode(node);
    scene.appendSelection(node);
    args.scg_object = node;
    this.fixParent(args);
    node.update();
    return node;
}

///// pairs

var GwfObjectPair = function (args) {
    GwfObject.call(this, args);

    this.required_attrs = ["id", "type", "id_b", "id_e", "dotBBalance", "dotEBalance", "idtf"];
}

GwfObjectPair.prototype = Object.create(GwfObject.prototype);

// have to specify pair and reader
GwfObjectPair.prototype.parseObject = function (args) {
    var pair = args.gwf_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(pair, this.required_attrs, this.optional_attrs);

    if (this.attributes === false)
        return false;

    //fix some attrs

    this.attributes["type"] = reader.getTypeCode(this.attributes.type);
    this.attributes["dotBBalance"] = parseFloat(this.attributes["dotBBalance"])
    this.attributes["dotEBalance"] = parseFloat(this.attributes["dotEBalance"])

    this.id = this.attributes["id"];

    // line points

    this.parsePoints(args);

    return this;

}
GwfObjectPair.prototype.buildObject = function (args) {
    var scene = args.scene;
    var builder = args.builder;
    var source = builder.getOrCreate(this.attributes["id_b"]);
    var target = builder.getOrCreate(this.attributes["id_e"]);
    var connector = SCg.Creator.generateConnector(source, target, this.attributes["type"]);
    if (this.attributes.hasOwnProperty("sc_addr"))
        connector.sc_addr = this.attributes.sc_addr;
    scene.appendConnector(connector);
    scene.appendSelection(connector);
    connector.source_dot = parseFloat(this.attributes["dotBBalance"]);
    connector.target_dot = parseFloat(this.attributes["dotEBalance"]);
    var connector_points = this.attributes["points"];
    var points = [];
    for (var i = 0; i < connector_points.length; i++) {
        var connector_point = connector_points[i];
        var point = new SCg.Vector2(parseFloat(connector_point.x) + GwfObjectController.getXOffset(), parseFloat(connector_point.y) + GwfObjectController.getYOffset());
        points.push(point);
    }
    connector.setPoints(points);
    source.update();
    target.update();
    if (source.contour && target.contour && source.contour === target.contour) {
        connector.contour = source.contour;
        connector.contour.addChild(connector);
    }
    connector.update();
    return connector;
}

//contour

var GwfObjectContour = function (args) {
    GwfObject.call(this, args);
    this.required_attrs = ["id", "parent"];
}

GwfObjectContour.prototype = Object.create(GwfObject.prototype);

GwfObjectContour.prototype.parseObject = function (args) {
    var contour = args.gwf_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(contour, this.required_attrs, this.optional_attrs);

    if (this.attributes == false)
        return false;

    this.id = this.attributes['id'];

    //contour points
    this.parsePoints(args);

    return this;
}

GwfObjectContour.prototype.buildObject = function (args) {
    var scene = args.scene;

    var contour_points = this.attributes["points"];

    var verticies = [];

    for (var i = 0; i < contour_points.length; i++) {
        var contour_point = contour_points[i];
        var vertex_x = parseFloat(contour_point.x);

        var vertex_y = parseFloat(contour_point.y);

        var vertex = new SCg.Vector3(vertex_x + GwfObjectController.getXOffset(), vertex_y + GwfObjectController.getYOffset(), 0);
        verticies.push(vertex);
    }

    var contour = SCg.Creator.createCounter(verticies);

    if (this.attributes.hasOwnProperty("sc_addr"))
        contour.sc_addr = this.attributes.sc_addr;

    args.scg_object = contour;
    this.fixParent(args);

    scene.appendContour(contour);
    scene.appendSelection(contour);
    contour.update();
    return contour;
}

var GwfObjectBus = function (args) {
    GwfObject.call(this, args);
    this.required_attrs = ["id", "parent", "b_x", "b_y", "e_x", "e_y", "owner", "idtf"];
}

GwfObjectBus.prototype = Object.create(GwfObject.prototype);

GwfObjectBus.prototype.parseObject = function (args) {
    var bus = args.gwf_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(bus, this.required_attrs, this.optional_attrs);

    if (this.attributes == false)
        return false;

    //fix attrs

    this.attributes["e_x"] = parseFloat(this.attributes["e_x"]);
    this.attributes["e_y"] = parseFloat(this.attributes["e_y"]);

    GwfObjectController.fixOffsetOfPoints({x: this.attributes["e_x"], y: this.attributes["e_y"]});

    this.id = this.attributes['id'];

    //bus points
    this.parsePoints(args);

    return this;
}

GwfObjectBus.prototype.buildObject = function (args) {
    var scene = args.scene;
    var builder = args.builder;


    var bus = SCg.Creator.createBus(builder.getOrCreate(this.attributes["owner"]));
    bus.setTargetDot(0);

    var bus_points = this.attributes["points"];
    var points = [];

    for (var i = 0; i < bus_points.length; i++) {
        var bus_point = bus_points[i];
        var point = new SCg.Vector2(parseFloat(bus_point.x) + GwfObjectController.getXOffset(), parseFloat(bus_point.y) + GwfObjectController.getYOffset());
        points.push(point);
    }

    points.push(new SCg.Vector2(this.attributes["e_x"] + GwfObjectController.getXOffset(), this.attributes["e_y"] + GwfObjectController.getYOffset()))

    bus.setPoints(points);

    args.scg_object = bus;
    this.fixParent(args);


    scene.appendBus(bus);
    scene.appendSelection(bus);
    bus.update();
    return bus;
}

var GwfObjectLink = function (args) {
    GwfObject.call(this, args);
    this.content = null;
    this.type = -1;
    this.requiredAttrs = ["id", "type", "x", "y", "parent", "idtf"];
};

GwfObjectLink.prototype = Object.create(GwfObject.prototype);

GwfObjectLink.prototype.parseObject = function (args) {
    function isHTML(str) {
        return /<[a-z][\s\S]*>/i.test(str);
    }

    function isFloat(value) {
        return !isNaN(value) && value.toString().indexOf('.') != -1;
    }

    var link = args.gwf_object;
    var reader = args.reader;
    this.attributes = reader.fetchAttributes(link, this.requiredAttrs, this.optional_attrs);
    if (this.attributes == false) return false;
    this.attributes["type"] = reader.getTypeCode(this.attributes.type);
    this.attributes["x"] = parseFloat(this.attributes["x"]);
    this.attributes["y"] = parseFloat(this.attributes["y"]);
    GwfObjectController.fixOffsetOfPoints({x: this.attributes["x"], y: this.attributes["y"]});
    this.id = this.attributes["id"];
    var content = link.getElementsByTagName("content")[0];
    this.type = reader.fetchAttributes(content, ["type"])["type"];
    var mime_type = reader.fetchAttributes(content, ["mime_type"])["mime_type"];
    switch (this.type) {
        case '1':
            this.type = 'string';
            break;
        case '3':
            this.type = 'int32';
            break;
        case '4':
            this.type = 'html';
            break;
        default:
            console.log('ERROR PARSE TYPE IN GwfObjectLink');
            break;
    }
    if (this.type != 'html') {
        this.content = content.textContent;
        if (isHTML(this.content)) {
            this.type = 'html';
        } else if (this.type === 'int32' && isFloat(this.content)) {
            this.type = 'float';
        }
    } else {
        this.content = '<img src="data:' + mime_type +
            ';base64,' + content.textContent + ' " alt="Image">';
        this.type = 'image';
    }
    return this;
};

GwfObjectLink.prototype.buildObject = function (args) {
    var scene = args.scene;
    let constancy = this.attributes["type"] & sc_type_constancy_mask;
    let linkType = sc_type_node_link | constancy;
    var link = SCg.Creator.generateLink(linkType, new SCg.Vector3(this.attributes["x"] + GwfObjectController.getXOffset(),
            this.attributes["y"] + +GwfObjectController.getYOffset(),
        0),
        '',
        this.attributes["idtf"]);
    if (this.attributes.hasOwnProperty("sc_addr"))
        link.sc_addr = this.attributes.sc_addr;
    link.setContent(this.content, this.type);
    scene.appendLink(link);
    scene.appendSelection(link);
    scene.updateLinkVisual();
    args.scg_object = link;
    this.fixParent(args);
    link.update();
    return link;
};

