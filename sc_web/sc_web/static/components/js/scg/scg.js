/* --- src/gwf-file-loader.js --- */
GwfFileLoader = {

    load: function (args) {


        var reader = new FileReader();

        var is_file_correct;
        reader.onload = function (e) {
            var text = e.target.result;
//            console.log(text);
//            text = text.replace("windows-1251","utf-8");
            is_file_correct = GwfObjectInfoReader.read(text.replace(
                "<?xml version=\"1.0\" encoding=\"windows-1251\"?>",
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
            ));

        }

        reader.onloadend = function (e) {
            if (is_file_correct != false) {
                ScgObjectBuilder.buildObjects(GwfObjectInfoReader.objects_info);
                args["render"].update();
            } else
                GwfObjectInfoReader.printErrors();

        }
        reader.readAsText(args["file"], "CP1251");
//        reader.readAsText(args["file"]);
        return true;
    }
}

/* --- src/gwf-model-objects.js --- */
var GwfObjectController = {
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


    var parent = this.attributes["parent"];

    if (parent != "0") {
        var parent_object = args.builder.getOrCreate(parent);
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

    this.attributes = reader.fetchAttributes(node, this.required_attrs);

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
    var builder = args.builder;

    var node = scene.createNode(this.attributes["type"], new SCg.Vector3(this.attributes["x"] + GwfObjectController.getXOffset(), this.attributes["y"] + +GwfObjectController.getYOffset(), 0), this.attributes["idtf"]);

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

    this.attributes = reader.fetchAttributes(pair, this.required_attrs);

    if (this.attributes == false)
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

    var edge = scene.createEdge(source, target, this.attributes["type"]);
    edge.source_dot = parseFloat(this.attributes["dotBBalance"]);
    edge.target_dot = parseFloat(this.attributes["dotEBalance"]);


    var edge_points = this.attributes["points"];
    var points = [];

    for (var i = 0; i < edge_points.length; i++) {
        var edge_point = edge_points[i];
        var point = new SCg.Vector2(parseFloat(edge_point.x) + GwfObjectController.getXOffset(), parseFloat(edge_point.y) + GwfObjectController.getYOffset());
        points.push(point);
    }
    edge.setPoints(points);
    source.update();
    target.update();
    edge.update();

    return edge;
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

    this.attributes = reader.fetchAttributes(contour, this.required_attrs);

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

    var contour = new SCg.ModelContour({
        verticies: verticies
    });

    args.scg_object = contour;
    this.fixParent(args);

    scene.appendContour(contour);

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

    this.attributes = reader.fetchAttributes(bus, this.required_attrs);

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


    var bus = new SCg.ModelBus({});

    bus.setSource(builder.getOrCreate(this.attributes["owner"]));
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
    bus.update();
    return bus;
}



/* --- src/gwf-object-info-reader.js --- */
GwfObjectInfoReader = {

    objects_info: { },
    errors: [],

    gwf_type_to_scg_type: {
        "node/-/not_define": sc_type_node,

        "node/const/general_node": sc_type_node | sc_type_const,
        "node/const/asymmetry": sc_type_node | sc_type_const | sc_type_node_tuple,
        "node/const/nopredmet": sc_type_node | sc_type_const | sc_type_node_struct,
        "node/const/attribute": sc_type_node | sc_type_const | sc_type_node_role,
        "node/const/relation": sc_type_node | sc_type_const | sc_type_node_norole,
        "node/const/material": sc_type_node | sc_type_const | sc_type_node_material,
        "node/const/group": sc_type_node | sc_type_const | sc_type_node_class,
        "node/const/predmet": sc_type_node | sc_type_const | sc_type_node_abstract,

        "node/var/general_node": sc_type_node | sc_type_var,
        "node/var/asymmetry": sc_type_node | sc_type_var | sc_type_node_tuple,
        "node/var/nopredmet": sc_type_node | sc_type_var | sc_type_node_struct,
        "node/var/attribute": sc_type_node | sc_type_var | sc_type_node_role,
        "node/var/relation": sc_type_node | sc_type_var | sc_type_node_norole,
        "node/var/material": sc_type_node | sc_type_var | sc_type_node_material,
        "node/var/group": sc_type_node | sc_type_var | sc_type_node_class,
        "node/var/predmet": sc_type_node | sc_type_var | sc_type_node_abstract,

        "arc/-/-": sc_type_arc_access,
        "arc/const/fuz/temp": sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp,
        "arc/const/fuz": sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm,
        "arc/const/pos/temp": sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp,
        "arc/const/pos": sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm,
        "arc/const/neg/temp": sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp,
        "arc/const/neg": sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm,
        "pair/const/orient": sc_type_arc_common | sc_type_const,
        "pair/const/synonym": sc_type_edge_common | sc_type_const,
        "pair/orient": sc_type_arc_common,

        "pair/var/orient": sc_type_arc_common | sc_type_var,
        "arc/var/fuz/temp": sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_temp,
        "arc/var/fuz": sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm,
        "arc/var/pos/temp": sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_temp,
        "arc/var/pos": sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm,
        "arc/var/neg/temp": sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_temp,
        "arc/var/neg": sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm,
        "pair/var/noorient": sc_type_edge_common | sc_type_var,
        "pair/var/synonym": sc_type_edge_common | sc_type_var
    },

    read: function (strs) {

        var xml_doc = (new DOMParser()).parseFromString(strs, "text/xml");

        var root = xml_doc.documentElement;

        if (root.nodeName == "html") {
            alert(root.getElementsByTagName("div")[0].innerHTML);
            return false;
        } else if (root.nodeName != "GWF") {
            alert("Given document has unsupported format " + root.nodeName);
            return false;
        }

        var static_sector = this.parseGroupOfElements(root, "staticSector", true);

        if (static_sector == false)
            return false;


        static_sector = static_sector[0];

        //contours

        var contours = this.parseGroupOfElements(static_sector, "contour", false);
        this.forEach(contours, this.parseContour);

        //nodes
        var nodes = this.parseGroupOfElements(static_sector, "node", false);
        this.forEach(nodes, this.parseNode);

        //buses
        var buses = this.parseGroupOfElements(static_sector, "bus", false);
        this.forEach(buses, this.parseBus);

        //arcs
        var arcs = this.parseGroupOfElements(static_sector, "arc", false);
        this.forEach(arcs, this.parsePair);

        //pairs
        var arcs = this.parseGroupOfElements(static_sector, "pair", false);
        this.forEach(arcs, this.parsePair);

        if (this.errors.length == 0)
            return true;
        else
            return false;

    },

    printErrors: function () {
        for (var i = 0; i < this.errors.length; i++)
            console.log(this.errors[i]);
    },

    parseGroupOfElements: function (parent, tag_name, is_required) {
        var elements = parent.getElementsByTagName(tag_name);
        if (elements.length == 0 && is_required == true) {
            this.errors.push("Unnable to find " + tag_name + " tag");
            return false;
        }
        return elements;
    },

    parseContour: function (contour) {
        var parsed_contour = new GwfObjectContour(null);

        var result = parsed_contour.parseObject({gwf_object: contour, reader: this});

        if (result == false)
            return false;

        this.objects_info[parsed_contour.id] = parsed_contour;

    },

    parsePair: function (pair) {
        var parsed_pair = new GwfObjectPair(null);

        var result = parsed_pair.parseObject({gwf_object: pair, reader: this});

        if (result == false)
            return false;

        this.objects_info[parsed_pair.id] = parsed_pair;

    },

    parseNode: function (node) {

        var parsed_node = new GwfObjectNode(null);


        if (parsed_node.parseObject({gwf_object: node, reader: this}) == false)
            return false;

        this.objects_info[parsed_node.id] = parsed_node;

    },

    parseBus: function (bus){
        var parsed_bus = new GwfObjectBus(null);

        if (parsed_bus.parseObject({gwf_object: bus, reader: this}) == false)
                    return false;
        this.objects_info[parsed_bus.id] = parsed_bus;
    },

    fetchAttributes: function (tag_element, required_attrs) {
        var tag_attributes = tag_element.attributes;
        var result_dict = {};

        for (var i = 0; i < required_attrs.length; i++) {
            var attribute = required_attrs[i];
            var found_attr = tag_attributes[attribute];
            if (found_attr != null) {
                result_dict[found_attr.name] = found_attr.value;
            } else {
                this.errors.push("Unnable to find " + attribute + " attribute.");
                return false;
            }
        }

        return result_dict;
    },

    forEach: function (array, fun) {
        for (var i = 0; i < array.length; i++)
            if (fun.call(this, array[i]) == false)
                return false;
    },

    getAttr: function (tag, attr_name) {
        return tag.getAttribute(attr_name);
    },

    getFloatAttr: function (tag, attr_name) {
        return parseFloat(this.getAttr(tag, attr_name));
    },
    getStrAttr: function (tag, attr_name) {

    },

    getTypeCode: function (gfw_type) {
        return this.gwf_type_to_scg_type[gfw_type];
    }
}


/* --- src/scg-object-builder.js --- */
ScgObjectBuilder = {
    scg_objects: {},
    gwf_objects: {},

    scene: null,

    buildObjects: function (gwf_objects) {
        this.gwf_objects = gwf_objects;

        for (var gwf_object_id  in gwf_objects) {
            var gwf_object = gwf_objects[gwf_object_id];
            if (gwf_object.attributes.id in this.scg_objects == false) {
                var scg_object = gwf_object.buildObject({
                    scene: this.scene,
                    builder: this
                });
                this.scg_objects[gwf_object.attributes.id] = scg_object;
            }
        }
    },

    getOrCreate: function (gwf_object_id) {
        var scg_object;
        if (gwf_object_id in this.scg_objects == false) {
            var gwf_object = this.gwf_objects[gwf_object_id];
            this.scg_objects[gwf_object_id] = gwf_object.buildObject({
                scene: this.scene,
                builder: this
            })
        }
        return this.scg_objects[gwf_object_id];
    }
}

/* --- src/scg.js --- */
var SCg = SCg || { version: "0.1.0" };

SCg.Editor = function() {

    this.render = null;
    this.scene = null;
};

SCg.Editor.prototype = {


    init: function(params)
    {
        this.typesMap = {
            'scg-type-node': sc_type_node,
            'scg-type-node-const': sc_type_node | sc_type_const,
            'scg-type-node-const-group': sc_type_node | sc_type_const | sc_type_node_class,
            'scg-type-node-const-abstract': sc_type_node | sc_type_const | sc_type_node_abstract,
            'scg-type-node-const-material': sc_type_node | sc_type_const | sc_type_node_material,
            'scg-type-node-const-norole': sc_type_node | sc_type_const | sc_type_node_norole,
            'scg-type-node-const-role': sc_type_node | sc_type_const | sc_type_node_role,
            'scg-type-node-const-struct': sc_type_node | sc_type_const | sc_type_node_struct,
            'scg-type-node-const-tuple': sc_type_node | sc_type_const | sc_type_node_tuple,
            'scg-type-node-var': sc_type_node | sc_type_var,
            'scg-type-node-var-group': sc_type_node | sc_type_var | sc_type_node_class,
            'scg-type-node-var-abstract': sc_type_node | sc_type_var | sc_type_node_abstract,
            'scg-type-node-var-material': sc_type_node | sc_type_var | sc_type_node_material,
            'scg-type-node-var-norole': sc_type_node | sc_type_var | sc_type_node_norole,
            'scg-type-node-var-role': sc_type_node | sc_type_var | sc_type_node_role,
            'scg-type-node-var-struct': sc_type_node | sc_type_var | sc_type_node_struct,
            'scg-type-node-var-tuple': sc_type_node | sc_type_var | sc_type_node_tuple,
            'scg-type-edge-common': sc_type_edge_common,
            'scg-type-arc-common': sc_type_arc_common,
            'scg-type-arc-common-access': sc_type_arc_access,
            'scg-type-edge-const': sc_type_edge_common | sc_type_const,
            'scg-type-arc-const': sc_type_arc_common | sc_type_const,
            'scg-type-arc-const-perm-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm,
            'scg-type-arc-const-perm-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm,
            'scg-type-arc-const-perm-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm,
            'scg-type-arc-const-temp-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp,
            'scg-type-arc-const-temp-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp,
            'scg-type-arc-const-temp-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp,
            'scg-type-edge-var': sc_type_edge_common | sc_type_var,
            'scg-type-arc-var': sc_type_arc_common | sc_type_var,
            'scg-type-arc-var-perm-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm,
            'scg-type-arc-var-perm-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm,
            'scg-type-arc-var-perm-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm,
            'scg-type-arc-var-temp-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_temp,
            'scg-type-arc-var-temp-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_temp,
            'scg-type-arc-var-temp-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_temp
        };
        
        this.render = new SCg.Render();
        this.scene = new SCg.Scene( {render: this.render } );
        this.scene.init();
        
        this.render.scene = this.scene;
        this.render.init(params);
        
        this.containerId = params.containerId;
        this.initUI();
        
    },
    
    /**
     * Initialize user interface
     */
    initUI: function() {
        var self = this;
        
        var container = '#' + this.containerId;
        $(container).prepend('<div id="tools-' + this.containerId + '"></div>');
        var tools_container = '#tools-' + this.containerId;
        $(tools_container).load('static/components/html/scg-tools-panel.html', function() {
             $.ajax({
                    url: "static/components/html/scg-types-panel-nodes.html", 
                    dataType: 'html',
                    success: function(response) {
                           self.node_types_panel_content = response;
                    },
                    error: function() {
                        SCgDebug.error("Error to get nodes type change panel");
                    },
                    complete: function() {
                        $.ajax({
                                url: "static/components/html/scg-types-panel-edges.html", 
                                dataType: 'html',
                                success: function(response) {
                                       self.edge_types_panel_content = response;
                                },
                                error: function() {
                                        SCgDebug.error("Error to get edges type change panel");
                                },
                                complete: function() {
                                    self.bindToolEvents();
                                }
                            });
                    }
                });
        });
        
        var self = this;
        this.scene.event_selection_changed = function() {
            self.onSelectionChanged();
        }
        this.scene.event_modal_changed = function() {
            self.onModalChanged();
        }
    },
    
    /**
     * Bind events to panel tools
     */
    bindToolEvents: function() {
        
        var self = this;
        var container = '#' + this.containerId;
        var cont = $(container);
            
        cont.find('#scg-tool-select').button('toggle');
        
        // handle clicks on mode change
        cont.find('#scg-tool-select').click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeSelect);
        });
        cont.find('#scg-tool-edge').click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeEdge);
        });
        cont.find('#scg-tool-bus').click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeBus);
        });
        cont.find('#scg-tool-contour').click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeContour);
        });
        cont.find('#scg-tool-change-idtf').click(function() {
            self.scene.setModal(SCgModalMode.SCgModalIdtf);
            $(this).popover({container: container});
            $(this).popover('show');
            
            var tool = $(this);
            
            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }
            
            
            var input = $(container + ' #scg-change-idtf-input');
            // setup initial value
            input.focus().val(self.scene.selected_objects[0].text);
            input.keypress(function (e) {
                if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                    
                    if (e.keyCode == KeyCode.Enter)   self.scene.selected_objects[0].setText(input.val());
                    stop_modal();
                    e.preventDefault();
                } 
                
            });
            
            // process controls
            $(container + ' #scg-change-idtf-apply').click(function() {
                self.scene.selected_objects[0].setText(input.val());
                stop_modal();
            });
            $(container + ' #scg-change-idtf-cancel').click(function() {
                stop_modal();
            });
            
        });
        
        cont.find('#scg-tool-change-type').click(function() {
            self.scene.setModal(SCgModalMode.SCgModalType);
            
            if (self.scene.selected_objects.length != 1) {
                SCgDebug.error('Something wrong with type selection');
                return;
            }
            
            var tool = $(this);
            
            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }
            
            var obj = self.scene.selected_objects[0];
            
            el = $(this);
            el.popover({
                    content: (obj instanceof SCg.ModelEdge) ? self.edge_types_panel_content : self.node_types_panel_content,
                    container: container,
                    title: 'Change type',
                    html: true,
                    delay: {show: 500, hide: 100}
                  }).popover('show');
                  
            cont.find('.popover-title').append('<button id="scg-type-close" type="button" class="close">&times;</button>');
                  
            $(container + ' #scg-type-close').click(function() {
                stop_modal();
            });

            $(container + ' .popover .btn').click(function() {
                var obj = self.scene.selected_objects[0];
                obj.setScType(self.typesMap[$(this).attr('id')]);
                self.scene.updateObjectsVisual();
                stop_modal();
            });
        });
        
        cont.find('#scg-tool-delete').click(function() {
            self.scene.deleteObjects(self.scene.selected_objects.slice(0, self.scene.selected_objects.length));
            self.scene.clearSelection();
        });


        //problem with opening the same doc twice
        cont.find('#scg-tool-open').click(function(){
            var document = $(this)[0].ownerDocument;
            var open_dialog = document.getElementById("scg-tool-open-dialog");

            open_dialog.onchange = function(){
                return GwfFileLoader.load({
                    file: open_dialog.files[0],
                    render : self.render});

            }
            ScgObjectBuilder.scene = self.scene;
            var result = open_dialog.click();
        });


        // initial update
        self.onModalChanged();
        self.onSelectionChanged();
    },
    
    /**
     * Function that process selection changes in scene
     * It updated UI to current selection
     */
    onSelectionChanged: function() {
        
        if (this.scene.selected_objects.length == 1) {
            this._enableTool('#scg-tool-change-idtf');
            this._enableTool('#scg-tool-change-type');
        } else {
            this._disableTool('#scg-tool-change-idtf');
            this._disableTool('#scg-tool-change-type');
        }
        
        if (this.scene.selected_objects.length > 0) {
            this._enableTool('#scg-tool-delete');
        } else {
            this._disableTool('#scg-tool-delete');
        }
    },
    
    /**
     * Function, that process modal state changes of scene
     */
    onModalChanged: function() {
        var self = this;
        function update_tool(tool_id) {
            if (self.scene.modal != SCgModalMode.SCgModalNone)
                self._disableTool(tool_id);
            else
                self._enableTool(tool_id);
        }
        
        update_tool('#scg-tool-select');
        update_tool('#scg-tool-edge');
        update_tool('#scg-tool-bus');
        update_tool('#scg-tool-contour');
        
        update_tool('#scg-tool-change-idtf');
        update_tool('#scg-tool-change-type');
        update_tool('#scg-tool-delete');
        update_tool('#scg-tool-zoomin');
        update_tool('#scg-tool-zoomout');
    },
    
    // -------------------------------- Helpers ------------------
    /**
     * Change specified tool state to disabled
     */
    _disableTool: function(tool_id) {
        $('#' + this.containerId).find(tool_id).attr('disabled', 'disabled');
    },
    
    /**
     * Change specified tool state to enabled
     */
    _enableTool: function(tool_id) {
         $('#' + this.containerId).find(tool_id).removeAttr('disabled');
    }
};


/* --- src/scg-debug.js --- */
var SCgDebug = {
    
    enabled: false,
    
    error: function(message) {
        if (!this.enabled) return; // do nothing
        
        alert(message);
    }
    
}


/* --- src/scg-math.js --- */
SCg.Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
};

SCg.Vector2.prototype = {
    constructor: SCg.Vector2,
    
    copyFrom: function(other) {
        this.x = other.x;
        this.y = other.y;
        
        return this;
    },
    
    clone: function() {
        return new SCg.Vector2(this.x, this.y);
    },
    
    add: function(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    },
    
    sub: function(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    },
    
    mul: function(other) {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    },
    
    div: function(other) {
        this.x /= other.x;
        this.y /= other.y;
        return this;
    },
    
    multiplyScalar: function(v) {
        this.x *= v;
        this.y *= v;
        return this;
    },
    
    divideScalar: function(v) {
        this.x /= v;
        this.y /= v;
        return this;
    },
    
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    
    lengthSquared: function() {
        return this.x * this.x + this.y * this.y;
    },
    
    normalize: function() {
        return this.divideScalar(this.length());
    },
    
    dotProduct: function(other) {
        return this.x * other.x + this.y * other.y;
    },
    
    crossProduct: function(other) {
        return this.x * other.y - this.y * other.x;
    }
};


// --------------------
SCg.Vector3 = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

SCg.Vector3.prototype = {
    constructor: SCg.Vector3,
    
    copyFrom: function(other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        
        return this;
    },
    
    clone: function() {
        return new SCg.Vector3(this.x, this.y, this.z);
    },
    
    sub: function(other) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        
        return this;
    },
    
    add: function(other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        
        return this;
    },
    
    mul: function(other) {
        this.x *= other.x;
        this.y *= other.y;
        this.z *= other.z;
        
        return this;
    },
    
    div: function(other) {
        this.x /= other.x;
        this.y /= other.y;
        this.z /= other.z;
        
        return this;
    },
    
    multiplyScalar: function(v) {
        this.x *= v;
        this.y *= v;
        this.z *= v;
        
        return this;
    },
    
    normalize: function() {
        var l = this.length();
        this.x /= l;
        this.y /= l;
        this.z /= l;
    },
    
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    
    lengthSquared: function() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },
    
    dotProduct: function(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    },
    
    crossProduct: function(other) {
        return new SCg.Vector3(
                this.y * other.z - this.z * other.y,
                this.z * other.x - this.x * other.z,
                this.x * other.y - this.y * other.x);
    },
    
    to2d: function() {
        return new SCg.Vector2(this.x, this.y);
    }
};

SCg.Algorithms = {};
/**
 * Check if a point is in polygon
 * http://habrahabr.ru/post/125356/
 * @param point object with 'x' and 'y' fields, {SCg.Vector2} for example
 * @param vertecies Array of points, which represents a polygon
 * @return {boolean} true if the point is in the polygon, false otherwise
 */
SCg.Algorithms.isPointInPolygon = function(point, vertecies) {
    // create copy of array of vertexies
    var polygon =  $.map(vertecies, function (vertex) {
        return $.extend({}, vertex);
    });

    var Q_PATT = [ [0,1], [3,2] ];

    var pred_pt = polygon[polygon.length - 1];
    var t1 = pred_pt.y - point.y < 0 ? 1 : 0;
    var t2 = pred_pt.x - point.x < 0 ? 1 : 0;
    var pred_q = Q_PATT[t1][t2];

    var w = 0;

    for (var i = 0; i < polygon.length; i++) {
        var cur_pt = polygon[i];
        cur_pt.x -= point.x;
        cur_pt.y -= point.y;

        t1 = cur_pt.y < 0 ? 1 : 0;
        t2 = cur_pt.x < 0 ? 1 : 0;
        var q = Q_PATT[t1][t2];

        switch (q - pred_q) {
            case -3:
                ++w;
                break;
            case 3:
                --w;
                break;
            case -2:
                if (pred_pt.x * cur_pt.y >= pred_pt.y * cur_pt.x)
                    ++w;
                break;
            case 2:
                if(!(pred_pt.x * cur_pt.y >= pred_pt.y * cur_pt.x))
                    --w;
                break;
        }

        pred_pt = cur_pt;
        pred_q = q;
    }

    return w != 0;
};

/**
 * Find intersection points of line and polygon
 * @param pin Array of points, which represents a polygon
 * @param segStart the first point, object with 'x' and 'y' fields, {SCg.Vector2} for example
 * @param segEnd the second point, object with 'x' and 'y' fields, {SCg.Vector2} for example
 * @return {Array} intersection points
 */
SCg.Algorithms.polyclip = function(pin, segStart, segEnd) {

    var inside = function(p, plane) {
        var d = p.x * plane[0] + p.y * plane[1];
        return d > plane[2];
    };

    var clip = function (segStart, segEnd, plane) {
        var d1 = segStart.x * plane[0] + segStart.y * plane[1] - plane[2];
        var d2 = segEnd.x * plane[0] + segEnd.y * plane[1] - plane[2];
        var t = (0 - d1) / (d2 - d1);
        var x1 = segStart.x + t * (segEnd.x - segStart.x);
        var y1 = segStart.y + t * (segEnd.y - segStart.y);
        return {x:x1, y:y1};
    };

    var plane = [segStart.y - segEnd.y, segEnd.x - segStart.x, 0];
    plane[2] = segStart.x * plane[0] + segStart.y * plane[1];
    var n = pin.length;
    var pout = [];
    var s = pin[n - 1];
    for (var ci = 0; ci < n; ci++) {
        var p = pin[ci];
        if (inside(p, plane)) {
            if (!inside(s, plane)) {
                var t = clip(s, p, plane);
                pout.push(t);
            }
        }
        else {
            if (inside(s, plane)) {
                var t = clip(s, p, plane);
                pout.push(t);
            }
        }

        s = p;
    }

    return pout;
};


/* --- src/scg-model-objects.js --- */
var SCgObjectState = {
    Normal: 0,
    MergedWithMemory: 1,
    NewInMemory: 2,
    FromMemory: 3
};

var ObjectId = 0;

/**
     * Initialize sc.g-object with specified options.
     * 
     * @param {Object} options
     * Initial options of object. There are possible options:
     * - observer - object, that observe this
     * - position - object position. SCg.Vector3 object
     * - scale - object size. SCg.Vector2 object.
     * - sc_type - object type. See sc-types for more info.
     * - text - text identifier of object
     */
SCg.ModelObject = function(options) {
    
    this.need_observer_sync = true;

    if (options.position) {
        this.position = options.position;
    }  else {
        this.position = new SCg.Vector3(0.0, 0.0, 0.0);
    }

    if (options.scale) {
        this.scale = options.scale;
    } else {
        this.scale = new SCg.Vector2(20.0, 20.0);
    }

    if (options.sc_type) {
        this.sc_type = options.sc_type;
    } else {
        this.sc_type = sc_type_node;
    }

    if (options.sc_addr) {
        this.sc_addr = options.sc_addr;
    } else {
        this.sc_addr = null;
    }
    
    if (options.text) {
        this.text = options.text;
    } else {
        this.text = null;
    }
    
    this.id = ObjectId++;

    this.edges = [];    // list of connected edges
    this.need_update = true;    // update flag
    this.state = SCgObjectState.Normal;
    this.is_selected = false;
    this.scene = null;
    this.bus = null;
};

SCg.ModelObject.prototype = {

    constructor: SCg.ModelObject

};

/**
 * Destroy object
 */
SCg.ModelObject.prototype.destroy = function() {
};

/**
 * Setup new position of object
 * @param {SCg.Vector3} pos
 *      New position of object
 */
SCg.ModelObject.prototype.setPosition = function(pos) {
    this.position = pos;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.notifyEdgesUpdate();
    this.notifyBusUpdate();
};

/**
 * Setup new scale of object
 * @param {SCg.Vector2} scale
 *      New scale of object
 */
SCg.ModelObject.prototype.setScale = function(scale) {
    this.scale = scale;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.update();
};

/**
 * Setup new text value
 * @param {String} text New text value
 */
SCg.ModelObject.prototype.setText = function(text) {
    this.text = text;
    this.need_observer_sync = true;
};

/**
 * Setup new type of object
 * @param {Integer} type New type value
 */
SCg.ModelObject.prototype.setScType = function(type) {
    this.sc_type = type;
    this.need_observer_sync = true;
};

/**
 * Notify all connected edges to sync
 */
SCg.ModelObject.prototype.notifyEdgesUpdate = function() {

    for (var i = 0; i < this.edges.length; i++) {
       this.edges[i].need_update = true;
       this.edges[i].need_observer_sync = true;
    }

};

/**
 * Notify connected bus to sync
 */
SCg.ModelObject.prototype.notifyBusUpdate = function() {

    if (this.bus != undefined) {
        this.bus.need_update = true;
        this.bus.need_observer_sync = true;
    }
};

/** Function iterate all objects, that need to be updated recursively, and 
 * mark them for update.
 */
SCg.ModelObject.prototype.requestUpdate = function() {
    this.need_update = true;
    for (var i = 0; i < this.edges.length; ++i) {
        this.edges[i].requestUpdate();
    }
    
    if (this.bus != undefined) {
        this.bus.requestUpdate();
    }
};

/** Updates object state.
 */
SCg.ModelObject.prototype.update = function() {

    this.need_update = false;
    this.need_observer_sync = true;

    for (var i = 0; i < this.edges.length; ++i) {
        var edge = this.edges[i];

        if (edge.need_update) {
            edge.update();
        }
    }
};

/*! Calculate connector position.
 * @param {SCg.Vector3} Position of other end of connector
 * @param {Float} Dot position on this object.
 * @returns Returns position of connection point (new instance of SCg.Vector3, that can be modified later)
 */
SCg.ModelObject.prototype.getConnectionPos = function(from, dotPos) {
    return this.position.clone();
};

/*! Calculates dot position on object, for specified coordinates in scene
 * @param {SCg.Vector2} pos Position in scene to calculate dot position
 */
SCg.ModelObject.prototype.calculateDotPos = function(pos) {
    return 0;
};

/*! Setup new state of object
 * @param {SCgObjectState} state New object state
 */
SCg.ModelObject.prototype.setObjectState = function(state) {
    this.state = state;
    this.need_observer_sync = true;
};

/*!
 * Change value of selection flag
 */
SCg.ModelObject.prototype._setSelected = function(value) {
    this.is_selected = value;
    this.need_observer_sync = true;
};

/**
 * Remove edge from edges list
 */
SCg.ModelObject.prototype.removeEdge = function(edge) {
    var idx = this.edges.indexOf(edge);
    
    if (idx < 0) {
        SCg.error("Something wrong in edges deletion");
        return;
    }
    
    this.edges.splice(idx, 1);
};

/**
 * Remove edge from edges list
 */
SCg.ModelObject.prototype.removeBus = function(edge) {
    
    this.bus = null;
};

/**
 * Setup new sc-addr of object
 */
SCg.ModelObject.prototype.setScAddr = function(addr) {
    
    // remove old sc-addr from map
    if (this.sc_addr && this.scene.objects.hasOwnPropery(this.sc_addr)) {
        delete this.scene.objects[this.sc_addr];
    }
    this.sc_addr = addr;
    //! @todo update state
    if (this.sc_addr)
        this.scene.objects[this.sc_addr] = this;
        
    this.need_observer_sync = true;
}

// -------------- node ---------

/**
 * Initialize sc.g-node object.
 * @param {Object} options
 *      Initial options of sc.g-node. It can include params from base object
 */
SCg.ModelNode = function(options) {

    SCg.ModelObject.call(this, options);
    
};

SCg.ModelNode.prototype = Object.create( SCg.ModelObject.prototype );

SCg.ModelNode.prototype.getConnectionPos = function(from, dotPos) {

    SCg.ModelObject.prototype.getConnectionPos.call(this, from, dotPos);

    var radius = this.scale.x;
    var center = this.position;
    
    var result = new SCg.Vector3(0, 0, 0);
    
    result.copyFrom(from).sub(center).normalize();
    result.multiplyScalar(radius).add(center);

    return result;
};

// --------------- arc -----------

/**
 * Initialize sc.g-arc(edge) object
 * @param {Object} options
 *      Initial opations of sc.g-arc. 
 */
SCg.ModelEdge = function(options) {
    
    SCg.ModelObject.call(this, options);

    this.source = null;
    this.target = null;

    if (options.source)
        this.setSource(options.source);
    if (options.target)
        this.setTarget(options.target);

    this.source_pos = null; // the begin position of egde in world coordinates
    this.target_pos = null; // the end position of edge in world coordinates
    this.points = [];
    this.source_dot = 0.5;
    this.target_dot = 0.5;

    //this.requestUpdate();
    //this.update();
};

SCg.ModelEdge.prototype = Object.create( SCg.ModelObject.prototype );

/**
 * Destroy object
 */
SCg.ModelEdge.prototype.destroy = function() {
    SCg.ModelObject.prototype.destroy.call(this);
    
    if (this.target)
        this.target.removeEdge(this);
    if (this.source)
        this.source.removeEdge(this);
};

/** 
 * Setup new source object for sc.g-edge
 * @param {Object} scg_obj
 *      sc.g-object, that will be the source of edge
 */
SCg.ModelEdge.prototype.setSource = function(scg_obj) {
    
    if (this.source == scg_obj) return; // do nothing
    
    if (this.source)
        this.source.removeEdge(this);
    
    this.source = scg_obj;
    this.source.edges.push(this);
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of source dot position
 */
SCg.ModelEdge.prototype.setSourceDot = function(dot) {
    this.source_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new target object for sc.g-edge
 * @param {Object} scg_obj
 *      sc.g-object, that will be the target of edge
 */
SCg.ModelEdge.prototype.setTarget = function(scg_obj) {
     
    if (this.target == scg_obj) return; // do nothing
    
    if (this.target)
        this.target.removeEdge(this);
    
    this.target = scg_obj;
    this.target.edges.push(this);
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of target dot position
 */
SCg.ModelEdge.prototype.setTargetDot = function(dot) {
    this.target_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

SCg.ModelEdge.prototype.update = function() {
    
    if (!this.source_pos)
        this.source_pos = this.source.position.clone();
    if (!this.target_pos)
        this.target_pos = this.target.position.clone();

    SCg.ModelObject.prototype.update.call(this);

    // calculate begin and end positions
    if (this.points.length > 0) {

        if (this.source instanceof SCg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(new SCg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
            this.target_pos = this.target.getConnectionPos(new SCg.Vector3(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, 0), this.target_dot);
        } else {
            this.target_pos = this.target.getConnectionPos(new SCg.Vector3(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, 0), this.target_dot);
            this.source_pos = this.source.getConnectionPos(new SCg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
        }
        
    } else {

        if (this.source instanceof SCg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
            this.target_pos = this.target.getConnectionPos(this.source_pos, this.target_dot);
        } else {
            this.target_pos = this.target.getConnectionPos(this.source_pos, this.target_dot);
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
        }
    }

    this.position.copyFrom(this.target_pos).add(this.source_pos).multiplyScalar(0.5);
};
 
/*! Checks if this edge need to be drawen with arrow at the end
 */
SCg.ModelEdge.prototype.hasArrow = function() {
   return this.sc_type & (sc_type_arc_common | sc_type_arc_access);
};
 
/*!
 * Setup new points for edge
 */
SCg.ModelEdge.prototype.setPoints = function(points) {
    this.points = points;
    this.need_observer_sync = true;
    this.requestUpdate();
};

SCg.ModelEdge.prototype.getConnectionPos = function(from, dotPos) {
    
    if (this.need_update)   this.update();
    
    // first of all we need to determine sector an it relative position
    var sector = Math.floor(dotPos);
    var sector_pos = dotPos - sector;
    
    // now we need to determine, if sector is correct (in sector bounds)
    if ((sector < 0) || (sector > this.points.length + 1)) {
        sector = this.points.length / 2;
    }
    
    var beg_pos, end_pos;
    if (sector == 0) {
        beg_pos = this.source_pos;
        if (this.points.length > 0)
            end_pos = new SCg.Vector3(this.points[0].x, this.points[0].y, 0);
        else
            end_pos = this.target_pos;
    } else if (sector == this.points.length) {
        end_pos = this.target_pos;
        if (this.points.length > 0) 
            beg_pos = new SCg.Vector3(this.points[sector - 1].x, this.points[sector - 1].y, 0);
        else
            beg_pos = this.source_pos;
    } else {
        beg_pos = new SCg.Vector3(this.points[sector - 1].x, this.points[sector - 1].y, 0);
        end_pos = new SCg.Vector3(this.points[sector].x, this.points[sector].y, 0);
    }
        
    var l_pt = new SCg.Vector3(0, 0, 0);
    
    l_pt.copyFrom(beg_pos).sub(end_pos);
    l_pt.multiplyScalar(1 - sector_pos).add(end_pos);
    
    var result = new SCg.Vector3(0, 0, 0);
    result.copyFrom(from).sub(l_pt).normalize();
    result.multiplyScalar(10).add(l_pt);
    
    return result;
}

SCg.ModelEdge.prototype.calculateDotPos = function(pos) {
    
    var pts = [this.source_pos.to2d()];
    for (idx in this.points)
        pts.push(new SCg.Vector2(this.points[idx].x, this.points[idx].y));
    pts.push(this.target_pos.to2d());
    
    var minDist = -1.0;
    var result = 0.0;
    
    for (var i = 1; i < pts.length; i++) {
        var p1 = pts[i - 1];
        var p2 = pts[i];

        var v = p2.clone().sub(p1);
        var vp = pos.clone().sub(p1);

        var vn = v.clone().normalize();

        // calculate point on line
        var p = p1.clone().add(vn.clone().multiplyScalar(vn.clone().dotProduct(vp)));
        
        if (v.length() == 0)
            return result;
            
        var dotPos = p.clone().sub(p1).length() / v.length();

        if (dotPos < 0 || dotPos > 1)
            continue;

        // we doesn't need to get real length, because we need minimum
        // so we get squared length to make that procedure faster
        var d = pos.clone().sub(p).lengthSquared();

        // compare with minimum distance
        if (minDist < 0 || minDist > d)
        {
            minDist = d;
            result = (i - 1) + dotPos;
        }
    }
    
    return result;
};
 
 //---------------- contour ----------------
 /**
 * Initialize sc.g-arc(edge) object
 * @param {Object} options
 *      Initial opations of sc.g-arc. 
 */
SCg.ModelContour = function(options) {
    
    SCg.ModelObject.call(this, options);

    this.childs = [];
    this.verticies = options.verticies ? options.verticies : [];
    this.sc_type = options.sc_type ? options.sc_type : sc_type_contour;
    this.previousPoint = null;

    var cx = 0;
    var cy = 0;
    for (var i = 0; i < this.verticies.length; i++) {
        cx += this.verticies[i].x;
        cy += this.verticies[i].y;
    }

    cx /= this.verticies.length;
    cy /= this.verticies.length;
    this.setPosition(new SCg.Vector3(cx, cy, 0));
    this.previousPoint = this.position;
    this.newPoint = this.position;
};

SCg.ModelContour.prototype = Object.create( SCg.ModelObject.prototype );

SCg.ModelContour.prototype.setNewPoint = function(pos) {

    this.newPoint = pos;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.notifyEdgesUpdate();
};

SCg.ModelContour.prototype.update = function() {
    if (this.previousPoint) {
        //var dx = this.position.x - this.previousPoint.x;
        //var dy = this.position.y - this.previousPoint.y;
        var dx = this.newPoint.x - this.previousPoint.x;
        var dy = this.newPoint.y - this.previousPoint.y;


        for (var i = 0; i < this.childs.length; i++) {
            var childNewPositionX = this.childs[i].position.x + dx;
            var childNewPositionY = this.childs[i].position.y + dy;
            var childNewPositionVector = new SCg.Vector3(childNewPositionX, childNewPositionY, 0)
            this.childs[i].setPosition(childNewPositionVector);
        }

        for (var i = 0; i < this.verticies.length; i++) {
            this.verticies[i].x += dx;
            this.verticies[i].y += dy;
        }

        var contourNewPositionX = this.position.x + dx;
        var contourNewPositionY = this.position.y + dy;
        var contourNewPositionVector = new SCg.Vector3(contourNewPositionX, contourNewPositionY, 0)
        this.setPosition(contourNewPositionVector);

        //this.previousPoint = this.position;
        this.previousPoint = this.newPoint;
    }

};

/**
 * Append new child into contour
 * @param {SCg.ModelObject} child Child object to append
 */
SCg.ModelContour.prototype.addChild = function(child) {
    this.childs.push(child);
    child.contour = this;
};

/**
 * Remove child from contour
 * @param {SCg.ModelObject} child Child object for remove
 */
SCg.ModelContour.prototype.removeChild = function(child) {
    var idx = this.childs.indexOf(child);
    this.childs.splice(idx, 1);
    child.contour = null;
};

SCg.ModelContour.prototype.isNodeInPolygon = function (node) {
    return SCg.Algorithms.isPointInPolygon(node.position, this.verticies);
};

/**
 * Convenient function for testing, which does mass checking nodes is in the contour
 * and adds them to childs of the contour
 * @param nodes array of {SCg.ModelNode}
 */
SCg.ModelContour.prototype.addNodesWhichAreInContourPolygon = function (nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].contour && this.isNodeInPolygon(nodes[i])) {
            this.addChild(nodes[i]);
        }
    }
};

SCg.ModelContour.prototype.getConnectionPos = function (from, dotPos) {
    var points = SCg.Algorithms.polyclip(this.verticies, from, this.position);
    var nearestIntersectionPoint = new SCg.Vector3(points[0].x, points[0].y, 0);
    for (var i = 1; i < points.length; i++) {
        var nextPoint = new SCg.Vector3(points[i].x, points[i].y, 0);
        var currentLength = from.clone().sub(nearestIntersectionPoint).length();
        var newLength = from.clone().sub(nextPoint).length();
        if (currentLength > newLength) {
            nearestIntersectionPoint = nextPoint;
        }
    }
    return nearestIntersectionPoint;
};

SCg.ModelBus = function(options) {
    
    SCg.ModelObject.call(this, options);

    this.source = null;

    if (options.source)
        this.setSource(options.source);

    this.source_pos = null; // the begin position of bus in world coordinates
    this.target_pos = null; // the end position of bus in world coordinates
    this.points = [];
    this.source_dot = 0.5;
    this.target_dot = 0.5;

    this.previousPoint = null;
    //this.requestUpdate();
    //this.update();
};

SCg.ModelBus.prototype = Object.create( SCg.ModelObject.prototype );

SCg.ModelBus.prototype.update = function() {
    
    if (!this.source_pos)
        this.source_pos = this.source.position.clone();
    if (!this.target_pos) {
        var target = this.points[this.points.length - 1];
        this.target_pos = new SCg.Vector3(target.x, target.y, 0);
    }
    SCg.ModelObject.prototype.update.call(this);

    // calculate begin and end positions
    if (this.points.length > 0) {
        
        if (this.source instanceof SCg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(new SCg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
        } else {
            this.source_pos = this.source.getConnectionPos(new SCg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
        }
        
    } else {
        
        if (this.source instanceof SCg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
        } else {
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
        }
    }

    this.position.copyFrom(this.target_pos).add(this.source_pos).multiplyScalar(0.5);
};

SCg.ModelBus.prototype.setSource = function(scg_obj) {
    
    if (this.source == scg_obj) return; // do nothing
    
    if (this.source)
        this.source.removeBus(this);
    
    this.source = scg_obj;
    this.source.bus = this;
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of source dot position
 */
SCg.ModelBus.prototype.setSourceDot = function(dot) {
    this.source_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of target dot position
 */
SCg.ModelBus.prototype.setTargetDot = function(dot) {
    this.target_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

/*!
 * Setup new points for bus
 */
SCg.ModelBus.prototype.setPoints = function(points) {
    this.points = points;
    this.need_observer_sync = true;
    this.requestUpdate();
};

SCg.ModelBus.prototype.getConnectionPos = SCg.ModelEdge.prototype.getConnectionPos;

SCg.ModelBus.prototype.calculateDotPos = SCg.ModelEdge.prototype.calculateDotPos;

SCg.ModelBus.prototype.changePosition = function(mouse_pos) {

    var dx = mouse_pos.x - this.previousPoint.x,
        dy = mouse_pos.y - this.previousPoint.y,
        diff = new SCg.Vector3(dx, dy, 0);

    this.position.add(diff);
    
    for (var i = 0; i < this.points.length; i++) {
        this.points[i].x += diff.x;
        this.points[i].y += diff.y;
    }

    var new_pos = this.source.position.clone().add(diff);
    this.source.setPosition(new_pos);


    this.previousPoint.x = mouse_pos.x;
    this.previousPoint.y = mouse_pos.y;

    this.need_observer_sync = true;

    this.requestUpdate();
    this.notifyEdgesUpdate();
};

SCg.ModelBus.prototype.destroy = function() {
    SCg.ModelObject.prototype.destroy.call(this);
    
    if (this.source)
        this.source.removeBus(this);
};

/* --- src/scg-alphabet.js --- */
var SCgAlphabet = {
    
    scType2Str: {},
    
    /**
     * Initialize all definitions, for svg drawer
     */
    initSvgDefs: function(defs) {
        
        this.initTypesMapping();
        
        // edge markers
        defs.append('svg:marker')
            .attr('id', 'end-arrow-access').attr('viewBox', '0 -5 10 10').attr('refX', 0)
            .attr('markerWidth', 5).attr('markerHeight', 10).attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4').attr('fill', '#000');
            
        defs.append('svg:marker')
            .attr('id', 'end-arrow-common').attr('viewBox', '0 -5 10 10').attr('refX', 0)
            .attr('markerWidth', 1.5).attr('markerHeight', 6).attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4').attr('fill', '#000');
            
        // nodes
        defs.append('svg:circle').attr('id', 'scg.node.const.outer').attr('cx', '0').attr('cy', '0').attr('r', '10');
        defs.append('svg:rect').attr('id', 'scg.node.var.outer').attr('x', '-10').attr('y', '-10').attr('width', '20').attr('height', '20');
            
        defs.append('svg:clip-path')
            .attr('id', 'scg.node.const.clip')
            .append('svg:use')
                .attr('xlink:href', '#scg.node.const.clip');
        
        defs.append('svg:clip-path')
            .attr('id', 'scg.node.var.clip')
            .append('svg:use')
                .attr('xlink:href', '#scg.node.var.clip');
                
                
        //  ----- define constant nodes -----      
        var g = defs.append('svg:g').attr('id', 'scg.node');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '5');
        g.append('svg:text').attr('x', '7').attr('y', '15').attr('class', 'SCgText');
        
        g = defs.append('svg:g').attr('id', 'scg.node.const');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.tuple');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.struct');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '3').attr('stroke', 'none').attr('fill', '#000');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.role');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '0').attr('x2', '0').attr('y1', '-10').attr('y2', '10').attr('stroke-width', '3');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.norole');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.class');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.abstract');//.attr('clip-path', 'url(#scg.node.const.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.material');//.attr('clip-path', 'url(#scg.node.const.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1').attr('transform', 'rotate(-45, 0, 0)');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
        
        //  ----- define variable nodes -----
        g = defs.append('svg:g').attr('id', 'scg.node.var');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.tuple');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.struct');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '3').attr('stroke', 'none').attr('fill', '#000');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.role');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '0').attr('x2', '0').attr('y1', '-10').attr('y2', '10').attr('stroke-width', '3');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.norole');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.class');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.abstract');//.attr('clip-path', 'url(#scg.node.var.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.node.var.material');//.attr('clip-path', 'url(#scg.node.var.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1').attr('transform', 'rotate(-45, 0, 0)');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
    },
    
    /**
     * Append sc.g-text to definition
     */
    appendText: function(def, x, y) {
       def.append('svg:text')
           .attr('x', '17')
           .attr('y', '21')
           .attr('class', 'SCgText')
    },
     
    /**
     * Return definition name by sc-type
     */
    getDefId: function(sc_type) {
        if (this.scType2Str.hasOwnProperty(sc_type)) {
            return this.scType2Str[sc_type];
        }
        
        return 'scg.node';
    },
     
    /**
     * Initialize sc-types mapping
     */
    initTypesMapping: function() {
        this.scType2Str[sc_type_node] = 'scg.node';
        this.scType2Str[sc_type_node | sc_type_const] = 'scg.node.const';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_material] = 'scg.node.const.material';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_abstract] = 'scg.node.const.abstract';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_class] = 'scg.node.const.class';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_struct] = 'scg.node.const.struct';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_norole] = 'scg.node.const.norole';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_role] = 'scg.node.const.role';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_tuple] = 'scg.node.const.tuple';

        this.scType2Str[sc_type_node | sc_type_var] = 'scg.node.var';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_material] = 'scg.node.var.material';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_abstract] = 'scg.node.var.abstract';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_class] = 'scg.node.var.class';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_struct] = 'scg.node.var.struct';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_norole] = 'scg.node.var.norole';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_role] = 'scg.node.var.role';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_tuple] = 'scg.node.var.tuple';
      },
      
    /**
     * All sc.g-edges represented by group of paths, so we need to update whole group.
     * This function do that work
     * @param egde {SCg.ModelEdge} Object that represent sc.g-edge
     * @param d3_group {} Object that represents svg group
     */
    updateEdge: function(edge, d3_group) {
        
        // first of all we need to determine if edge has an end marker
        var has_marker = edge.hasArrow();
        
        // now calculate target and source positions
        var pos_src = edge.source_pos.clone();
        var pos_trg = edge.target_pos.clone();
        
        // if we have an arrow, then need to fix end position
        if (has_marker) {
            var prev_pos = pos_src;
            if (edge.points.length > 0) {
                prev_pos = new SCg.Vector3(edge.points[edge.points.length - 1].x, edge.points[edge.points.length - 1].y, 0);
            }
            
            var dv = pos_trg.clone().sub(prev_pos);
            var len = dv.length();
            dv.normalize();
            pos_trg = prev_pos.clone().add(dv.multiplyScalar(len - 10));
        }
        
        // make position path
        var position_path = 'M' + pos_src.x + ',' + pos_src.y;
        for (idx in edge.points) {
            position_path += 'L' + edge.points[idx].x + ',' + edge.points[idx].y;
        }
        position_path += 'L' + pos_trg.x + ',' + pos_trg.y;
        
        var sc_type_str = edge.sc_type.toString();
        if (d3_group['sc_type'] != sc_type_str) {
            d3_group.attr('sc_type', sc_type_str);
            
            // remove old
            d3_group.selectAll('path').remove();
            
            d3_group.append('svg:path').classed('SCgEdgeSelectBounds', true).attr('d', position_path);
            
            // if it accessory, then append main line
            if (edge.sc_type & sc_type_arc_access) {
                
                var main_style = 'SCgEdgeAccessPerm';
                if (edge.sc_type & sc_type_arc_temp) {
                    main_style = edge.sc_type & sc_type_var ? 'SCgEdgeAccessTempVar' : 'SCgEdgeAccessTemp';
                }
                
                var p = d3_group.append('svg:path')
                    .classed(main_style, true)
                    .classed('SCgEdgeEndArrowAccess', true)
                    .attr('d', position_path);
                    
                if (edge.sc_type & sc_type_constancy_mask) {
                    p.classed('SCgEdgeVarDashAccessPerm', (edge.sc_type & sc_type_var) && (edge.sc_type & sc_type_arc_perm));
                } else {
                    d3_group.append('svg:path')
                        .classed('SCgEdgeAccessComonDash', true)
                        .attr('d', position_path);
                }

                if (edge.sc_type & sc_type_arc_neg) {
                    d3_group.append('svg:path')
                        .classed('SCgEdgePermNegDash', true)
                        .attr('d', position_path);
                }
            } else if (edge.sc_type & (sc_type_arc_common | sc_type_edge_common)) {
                
                var p = d3_group.append('svg:path')
                    .classed('SCgEdgeCommonBack', true)
                    .classed('SCgEdgeEndArrowCommon', edge.sc_type & sc_type_arc_common)
                    .attr('d', position_path);
                
                d3_group.append('svg:path')
                    .classed('SCgEdgeCommonForeground', true)
                    .attr('d', position_path)
                    
                if (edge.sc_type & sc_type_constancy_mask) {
                    if (edge.sc_type & sc_type_var) {
                        d3_group.append('svg:path')
                            .classed('SCgEdgeCommonForegroundVar', true)
                            .classed('SCgEdgeVarDashCommon', true)
                            .attr('d', position_path);
                    }
                } else {
                    d3_group.append('svg:path')
                        .classed('SCgEdgeAccessPerm', true)
                        .classed('SCgEdgeVarDashCommon', true)
                        .attr('d', position_path);
                }
                
            } else {
                // unknown
                d3_group.append('svg:path')
                    .classed('SCgEdgeUnknown', true)
                    .attr('d', position_path);
            }
            
        } else { 
            // update existing
            d3_group.selectAll('path')
                .attr('d', position_path);
        }
        
        // now we need to draw fuz markers (for now it not supported)
        if (edge.sc_type & sc_type_arc_fuz) {
            d3_group.selectAll('path').attr('stroke', '#f00');
        }
        
    },
	
	updateBus: function(bus, d3_group) {
                
        var pos_src = bus.source_pos.clone();
        
        // make position path
        var position_path = 'M' + pos_src.x + ',' + pos_src.y;
        for (idx in bus.points) {
            position_path += 'L' + bus.points[idx].x + ',' + bus.points[idx].y;
        }
        
        if (d3_group[0][0].childElementCount == 0) {
            
            d3_group.append('svg:path').classed('SCgBusPath', true).attr('d', position_path);
            
            // if it accessory, then append main line
            
            
        } else { 
            // update existing
            d3_group.selectAll('path')
                .attr('d', position_path);
        }
        
    }
};


/* --- src/scg-render.js --- */


SCg.Render = function() {
    this.scene = null;
};

SCg.Render.prototype = {

    init: function(params) {
        this.containerId = params.containerId;
        this.d3_drawer = d3.select('#' + this.containerId).append("svg:svg").attr("pointer-events", "all").attr("width", '100%').attr("height", '100%');
        
        d3.select('#' + this.containerId);//.attr('style', 'display: block');
        
        var self = this;
        this.d3_container = this.d3_drawer.append('svg:g')
                                .attr("class", "SCgSvg")
                                .on('mousemove', function() {
                                    self.onMouseMove(this, self);
                                })
                                .on('mousedown', function() {
                                    self.onMouseDown(this, self);
                                })
                                .on('mouseup', function() {
                                    self.onMouseUp(this, self);
                                })
                                .on('dblclick', function() {
                                    self.onMouseDoubleClick(this, self);
                                });
        
        // need to check if container is visible
        d3.select(window)
                .on('keydown', function() {
                    self.onKeyDown(d3.event.keyCode);
                })
                .on('keyup', function() {
                    self.onKeyUp(d3.event.keyCode);
                });
        this.initDefs();
                                    
        this.d3_container.append('svg:rect')
                        .style("fill", "url(#backGrad)")
                        .attr('width', '100%') //parseInt(this.d3_drawer.style("width")))
                        .attr('height', '100%');//parseInt(this.d3_drawer.style("height")));
                        
                        
        this.d3_drag_line = this.d3_container.append('svg:path')
                .attr('class', 'dragline hidden')
                .attr('d', 'M0,0L0,0');
                
        this.d3_contour_line = d3.svg.line().interpolate("cardinal-closed");
                        
        this.d3_contours = this.d3_container.append('svg:g').selectAll('path');
        this.d3_edges = this.d3_container.append('svg:g').selectAll('path');
        this.d3_nodes = this.d3_container.append('svg:g').selectAll('g');
        this.d3_buses = this.d3_container.append('svg:g').selectAll('path');
        this.d3_dragline = this.d3_container.append('svg:g');
        this.d3_line_points = this.d3_container.append('svg:g');
        
        this.line_point_idx = -1;
    },
    
    // -------------- Definitions --------------------
    initDefs: function() {
        // define arrow markers for graph links
        var defs = this.d3_drawer.append('svg:defs')
        
        SCgAlphabet.initSvgDefs(defs);

        var grad = defs.append('svg:radialGradient')
            .attr('id', 'backGrad')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '100%').attr("spreadMethod", "pad");
            
            grad.append('svg:stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgb(255,253,252)')
            .attr('stop-opacity' , '1')
            grad.append('svg:stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgb(245,245,245)')
            .attr('stop-opacity', '1')
            
        // drag line point control
        var p = defs.append('svg:g')
                .attr('id', 'dragPoint')
                p.append('svg:circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', 10)

                p.append('svg:path')
                    .attr('d', 'M-5,-5L5,5M-5,5L5,-5');
                    
        // line point control
        p = defs.append('svg:g')
                .attr('id', 'linePoint')
                p.append('svg:circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', 10);

        p = defs.append('svg:g')
            .attr('id', 'contourAcceptPoint')
            p.append('svg:circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 10)
            p.append('svg:path')
                .attr('d', 'M-5,-5 L0,5 5,-5');
    },
    
    // -------------- draw -----------------------
    update: function() {

        var self = this;
        
        // update nodes visual
        this.d3_nodes = this.d3_nodes.data(this.scene.nodes, function(d) { return d.id; });
        
        // add nodes that haven't visual
        var g = this.d3_nodes.enter().append('svg:g')
            .attr('class', function(d) {
                return (d.sc_type & sc_type_constancy_mask) ? 'SCgNode' : 'SCgNodeEmpty';
            })
            .attr("transform", function(d) {
                return 'translate(' + d.position.x + ', ' + d.position.y + ')';
            })
            .on('mouseover', function(d) {
                // enlarge target node
                d3.select(this).classed('SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgStateHighlighted', false)
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });
                        
        g.append('svg:use')
            .attr('xlink:href', function(d) {
                return '#' + SCgAlphabet.getDefId(d.sc_type); 
            })

        g.append('svg:text')
            .attr('class', 'SCgText')
            .attr('x', function(d) { return d.scale.x / 1.3; })
            .attr('y', function(d) { return d.scale.y / 1.3; })
            .text(function(d) { return d.text; });
            
        this.d3_nodes.exit().remove();
            
        // update edges visual
        this.d3_edges = this.d3_edges.data(this.scene.edges, function(d) { return d.id; });
        
        // add edges that haven't visual
        this.d3_edges.enter().append('svg:g')
            .classed('SCgStateNormal', true)
            .classed('SCgEdge', true)
            .attr('pointer-events', 'visibleStroke')
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });
        
        this.d3_edges.exit().remove();

        // update contours visual
        this.d3_contours = this.d3_contours.data(this.scene.contours, function(d) { return d.id; });

        g = this.d3_contours.enter().append('svg:polygon')
            .attr('class', 'SCgContour')
            .attr('points', function(d) {
                var verteciesString = "";
                for (var i = 0; i < d.verticies.length; i++) {
                    var vertex = d.verticies[i].x + ', ' + d.verticies[i].y + ' ';
                    verteciesString = verteciesString.concat(vertex);
                }
                return verteciesString;
            })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });

        this.d3_contours.exit().remove();
        
        // update buses visual
        this.d3_buses = this.d3_buses.data(this.scene.buses, function(d) { return d.id; });

        this.d3_buses.enter().append('svg:g')
            .classed('SCgStateNormal', true)
            .classed('SCgBus', true)
            .attr('pointer-events', 'visibleStroke')
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });
        this.d3_buses.exit().remove();

        this.updateObjects();
    },

    updateObjects: function() {

        var self = this;
        this.d3_nodes.each(function (d) {
            
            if (!d.need_observer_sync) return; // do nothing
            
            d.need_observer_sync = false;
            
            var g = d3.select(this).attr("transform", 'translate(' + d.position.x + ', ' + d.position.y + ')')
                            .classed('SCgStateSelected', function(d) {
                                return d.is_selected;
                            })
                            
            g.select('use')
                .attr('xlink:href', function(d) {
                    return '#' + SCgAlphabet.getDefId(d.sc_type); 
                })
                .attr("sc_addr", function(d) {
                    return d.sc_addr;
                });
            
            g.selectAll('text').text(function(d) { return d.text; });;
        });
        
        this.d3_edges.each(function(d) {
            
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;
            
            if (d.need_update)
                d.update();
            var d3_edge = d3.select(this);
            SCgAlphabet.updateEdge(d, d3_edge);
            d3_edge.classed('SCgStateSelected', function(d) {
                return d.is_selected;
            });
        });
        this.d3_contours.each(function(d) {
        
            d3.select(this).attr('d', function(d) { 

                if (!d.need_observer_sync) return; // do nothing

                if (d.need_update)
                    d.update();

                var d3_contour = d3.select(this);

                d3_contour.classed('SCgStateSelected', function(d) {
                    return d.is_selected;
                });

                d3_contour.attr('points', function(d) {
                    var verteciesString = "";
                    for (var i = 0; i < d.verticies.length; i++) {
                        var vertex = d.verticies[i].x + ', ' + d.verticies[i].y + ' ';
                        verteciesString = verteciesString.concat(vertex);
                    }
                    return verteciesString;
                });

                d.need_update = false;
                d.need_observer_sync = false;

                return self.d3_contour_line(d.verticies) + 'Z';
            });
        });

        this.d3_buses.each(function(d) {
            
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;
            
            if (d.need_update)
                d.update();
            var d3_bus = d3.select(this);
            SCgAlphabet.updateBus(d, d3_bus);
            d3_bus.classed('SCgStateSelected', function(d) {
                return d.is_selected;
            });
        });
    },
    
    updateTexts: function() {
        this.d3_nodes.select('text').text(function(d) { return d.text; });
    },
    
    updateDragLine: function() {
        var self = this;
        
        // remove old points
        drag_line_points = this.d3_dragline.selectAll('use.SCgDragLinePoint');
        points = drag_line_points.data(this.scene.drag_line_points, function(d) { return d.idx; })
        points.exit().remove();
        
        if (this.scene.edit_mode == SCgEditMode.SCgModeBus) {
            this.d3_drag_line.classed('dragline', false);   
            this.d3_drag_line.classed('draglineBus', true); 

            var bus_points = this.d3_dragline.selectAll('use.SCgBusEndPoint');
            if (this.scene.bus_data.end != null) {
                //if (bus_points.length < 2) d3.select(self.d3_drag_line[0][0]).classed('SCgBus', false);
                
                var end_point = bus_points.data([this.scene.bus_data.end], function(d) { return d.idx; });
                end_point.exit().remove();
                end_point.enter().append('scg:use')
                    .classed('SCgBusEndPoint', true)
                    .attr('xlink:href', '#dragPoint')
                    .attr('transform', function(d) {
                        return 'translate(' + (d.x + 20) + ',' + d.y + ')';
                    })
                    .on('mouseover', function(d) {
                        d3.select(this).classed('SCgBusEndPointHighlighted', true);
                        d3.select(self.d3_drag_line[0][0]).classed('SCgBus', true);
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).classed('SCgBusEndPointHighlighted', false);
                        d3.select(self.d3_drag_line[0][0]).classed('SCgBus', false);
                    })
                    .on('mousedown', function(d) {
                        self.scene.finishBusCreation(d.idx);
                        d3.select(self.d3_drag_line[0][0]).classed('SCgBus', false);
                        d3.event.stopPropagation();
                    });
            } 
            else bus_points.remove();
        }
        else if (this.scene.edit_mode == SCgEditMode.SCgModeEdge) {
            this.d3_drag_line.classed('SCgBus', false)
            this.d3_drag_line.classed('dragline', true);    
            this.d3_drag_line.classed('draglineBus', false);        
        }
        
        if (this.scene.drag_line_points.length < 1) {
            this.d3_drag_line.classed('hidden', true);
            return;
        }        
        
        points.enter().append('svg:use')
            .attr('class', function(d) {
                if  (d.idx == 0 && self.scene.edit_mode == SCgEditMode.SCgModeContour) {
                    return 'SCgContourAcceptPoint';
                }
                else {
                    return 'SCgDragLinePoint';
                }
            })
            .attr('xlink:href', function(d) {
                if  (d.idx == 0 && self.scene.edit_mode == SCgEditMode.SCgModeContour) {
                    return '#contourAcceptPoint';
                }
                else {
                    return '#dragPoint';
                }
            })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgDragLinePointHighlighted', true);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgDragLinePointHighlighted', false);
            })
            .on('mousedown', function(d) {
                if (d.idx == 0 && self.scene.edit_mode == SCgEditMode.SCgModeContour) {
                    self.scene.createCurrentContour();
                }
                else {
                    self.scene.revertDragPoint(d.idx);
                    d3.event.stopPropagation();
                }
            });
            
        this.d3_drag_line.classed('hidden', false);        
        
        var d_str = '';
        // create path description
        for (idx in this.scene.drag_line_points) {
            var pt = this.scene.drag_line_points[idx];
            
            if (idx == 0) 
                d_str += 'M';
            else
                d_str += 'L';
            d_str += pt.x + ',' + pt.y;
        }
    
        d_str += 'L' + this.scene.mouse_pos.x + ',' + this.scene.mouse_pos.y;
        
        // update drag line
        this.d3_drag_line.attr('d', d_str);
    },
    
    updateLinePoints: function() {
        var self = this;
        
        line_points = this.d3_line_points.selectAll('use');
        points = line_points.data(this.scene.line_points, function(d) { return d.idx; })
        points.exit().remove();
        
        if (this.scene.line_points.length == 0)
            this.line_points_idx = -1;
        
        points.enter().append('svg:use')
            .classed('SCgLinePoint', true)
            .attr('xlink:href', '#linePoint')
            .attr('transform', function(d) {
                return 'translate(' + d.pos.x + ',' + d.pos.y + ')';
            })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgLinePointHighlighted', true);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgLinePointHighlighted', false);
            })
            .on('mousedown', function(d) {
                self.line_point_idx = d.idx;
            });
            /*.on('mouseup', function(d) {
                self.scene.pointed_object = null;
            });*/
            
        line_points.each(function(d) {
            d3.select(this).attr('transform', function(d) {
                return 'translate(' + d.pos.x + ',' + d.pos.y + ')';
            });
        });
    },
    
    // -------------- Objects --------------------
    appendRenderNode: function(render_node) {
        render_node.d3_group = this.d3_container.append("svg:g");
    },

    appendRenderEdge: function(render_edge) {
        render_edge.d3_group = this.d3_container.append("g");
    },

    // --------------- Events --------------------
    onMouseDown: function(window, render) {
        var point = d3.mouse(window);
        render.scene.onMouseDown(point[0], point[1]);         
    },
    
    onMouseUp: function(window, render) {
        var point = d3.mouse(window);
        
         if (this.line_point_idx >= 0) {
             this.line_point_idx = -1;
             d3.event.stopPropagation();
             return;
         }
        
        render.scene.onMouseUp(point[0], point[1]);
    },
    
    onMouseMove: function(window, render) {
        var point = d3.mouse(window);
        
        if (this.line_point_idx >= 0) {
            this.scene.setLinePointPos(this.line_point_idx, {x: point[0], y: point[1]});
            d3.event.stopPropagation();
        }
        
        render.scene.onMouseMove(point[0], point[1]);
    },
    
    onMouseDoubleClick: function(window, render) {
        var point = d3.mouse(window);
        this.scene.onMouseDoubleClick(point[0], point[1]);
    },
    
    onKeyDown: function(key_code) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyDown(key_code))
            d3.event.stopPropagation();
        
    },
    
    onKeyUp: function(key_code) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyUp(key_code))
            d3.event.stopPropagation();
    },
    
    
    // ------- help functions -----------
    getContainerSize: function() {
        var el = document.getElementById(this.containerId);
        return [el.clientWidth, el.clientHeight];
    }
    

}


/* --- src/scg-scene.js --- */
var SCgEditMode = {
    SCgModeSelect: 0,
    SCgModeEdge: 1,
    SCgModeBus: 2,
    SCgModeContour: 3,
    
    /**
     * Check if specified mode is valid
     */
    isValid: function(mode) {
        return (mode >= this.SCgModeSelect) && (mode <= this.SCgModeContour);
    }
};

var SCgModalMode = {
    SCgModalNone: 0,
    SCgModalIdtf: 1,
    SCgModalType: 2
};

var KeyCode = {
    Escape: 27,
    Enter: 13
};

SCg.Scene = function(options) {

    this.render = options.render;
    this.nodes = [];
    this.edges = [];
    this.contours = [];
    this.buses = [];
    
    this.objects = {};
    this.edit_mode = SCgEditMode.SCgModeSelect;
    
    // object, that placed under mouse
    this.pointed_object = null;
    // object, that was mouse pressed
    this.focused_object = null;
    
    // list of selected objects
    this.selected_objects = [];
    
    // drag line points
    this.drag_line_points = [];
    // points of selected line object
    this.line_points = [];
        
    // mouse position
    this.mouse_pos = new SCg.Vector3(0, 0, 0);
    
    // edge source and target
    this.edge_data = {source: null, target: null};
    
    // bus source
    this.bus_data = {source: null, end: null};
    
    // callback for selection changed
    this.event_selection_changed = null;
    // callback for modal state changes
    this.event_modal_changed = null;
        
    /* Flag to lock any edit operations
     * If this flag is true, then we doesn't need to process any editor operatons, because
     * in that moment shows modal dialog
     */
    this.modal = SCgModalMode.SCgModalNone;
};

SCg.Scene.prototype = {

    constructor: SCg.Scene,

    init: function() {
        this.layout_manager = new SCg.LayoutManager();
        this.layout_manager.init(this);
    },

    /**
     * Appends new sc.g-node to scene
     * @param {SCg.ModelNode} node Node to append
     */
    appendNode: function(node) {
        this.nodes.push(node);
        node.scene = this;
        if (node.sc_addr)
            this.objects[node.sc_addr] = node;
    },

    /**
     * Appends new sc.g-edge to scene
     * @param {SCg.ModelEdge} edge Edge to append
     */
    appendEdge: function(edge) {
        this.edges.push(edge);
        edge.scene = this;
        if (edge.sc_addr)
            this.objects[edge.sc_addr] = edge;
    },
     
    /**
     * Append new sc.g-contour to scene
     * @param {SCg.ModelContour} contour Contour to append
     */
    appendContour: function(contour) {
        this.contours.push(contour);
        contour.scene = this;
        if (contour.sc_addr)
            this.objects[contour.sc_addr] = contour;
    },
    
    /**
     * Append new sc.g-contour to scene
     * @param {SCg.ModelContour} contour Contour to append
     */
    appendBus: function(bus) {
        this.buses.push(bus);
        bus.scene = this;
    },
    
    /**
     * Remove object from scene.
     * @param {SCg.ModelObject} obj Object to remove
     */
    removeObject: function(obj) {
        function remove_from_list(obj, list) {
            var idx = list.indexOf(obj);
            if (idx < 0) {
                SCgDebug.error("Can't find object for remove");
                return;
            }
            
            list.splice(idx, 1);
        }
        
        if (obj instanceof SCg.ModelNode) {
            remove_from_list(obj, this.nodes);
        } else if (obj instanceof SCg.ModelEdge) {
            remove_from_list(obj, this.edges);
        } else if (obj instanceof SCg.ModelContour) {
            this.deleteObjects(obj.childs);
            remove_from_list(obj, this.contours);
        } else if (obj instanceof SCg.ModelBus) {
            remove_from_list(obj, this.buses);
        }
        
        if (obj.sc_addr)
            delete this.objects[obj.sc_addr];
    },

    // --------- objects create/destroy -------
    /**
     * Create new node
     * @param {Integer} sc_type Type of node
     * @param {SCg.Vector3} pos Position of node
     * @param {String} text Text assotiated with node
     * 
     * @return Returns created node
     */
    createNode: function(sc_type, pos, text) {
        var node = new SCg.ModelNode({ 
                        position: pos.clone(), 
                        scale: new SCg.Vector2(20, 20),
                        sc_type: sc_type,
                        text: text
                    });
        this.appendNode(node);
        
        return node;
    },
    
    /**
     * Create edge between two specified objects
     * @param {SCg.ModelObject} source Edge source object
     * @param {SCg.ModelObject} target Edge target object
     * @param {Integer} sc_type SC-type of edge
     *
     * @return Returns created edge
     */
    createEdge: function(source, target, sc_type) {
        var edge = new SCg.ModelEdge({
                                        source: source,
                                        target: target,
                                        sc_type: sc_type ? sc_type : sc_type_edge_common
                                    });
        this.appendEdge(edge);
        
        return edge;
    },
    
    createBus: function(source) {
        var bus = new SCg.ModelBus({
                                      source: source
                                  });
        this.appendBus(bus);
        
        return bus;
    },
    
    /**
     * Delete objects from scene
     * @param {Array} objects Array of sc.g-objects to delete
     */
    deleteObjects: function(objects) {
        function collect_objects(container, root) {
            if (container.indexOf(root) >= 0)
                return;
            
            container.push(root);
            for (idx in root.edges) {
                collect_objects(container, root.edges[idx]);
            }

            if (root.bus)
                collect_objects(container, root.bus);
        }
        
        // collect objects for remove
        var objs = [];
        
        // collect objects for deletion
        for (var idx in objects)
            collect_objects(objs, objects[idx]);

        // delete objects
        for (var idx in objs) {
            this.removeObject(objs[idx]);
            objs[idx].destroy();
        }
        
        this.updateRender();
    },
    
    /**
     * Updates render
     */
    updateRender: function() {
        this.render.update();
    },
    
    /**
     * Updates render objects state
     */
    updateObjectsVisual: function() {
        this.render.updateObjects();
    },

    // --------- layout --------
    layout: function() {
       this.layout_manager.doLayout();
       this.render.update();
    },
     
    onLayoutTick: function() {
    },
     
    /**
     * Returns size of container, where graph drawing
     */
    getContainerSize: function() {
        return this.render.getContainerSize();
    },
     
     /**
      * Return array that contains sc-addrs of all objects in scene
      */
    getScAddrs: function() {
        var keys = new Array();
        for (key in this.objects) {
            keys.push(key);
        }
        return keys;
    },
    
    /**
     * Return object by sc-addr
     * @param {String} addr sc-addr of object to find
     * @return If object founded, then return it; otherwise return null
     */
    getObjectByScAddr: function(addr) {
        if (this.objects.hasOwnProperty(addr))
            return this.objects[addr];
            
        return null;
    },
    
    /**
     * Append selection to object
     */
    appendSelection: function(obj) {
        if (obj.is_selected) {
            SCgDebug.error('Object trying to be selecting twice');
            return;
        }
        
        this.selected_objects.push(obj);
        obj._setSelected(true);
        
        this.selectionChanged();
    },
    
    /**
     * Remove selection from object
     */
    removeSelection: function(obj) {
        
        var idx = this.selected_objects.indexOf(obj);
        
        if (idx == -1 || !obj.is_selected) {
            SCgDebug.error('Trying to remove selection from unselected object');
            return;
        }
        
        this.selected_objects.splice(idx, 1);
        obj._setSelected(false);
        
        this.selectionChanged();
    },
    
    /**
     * Clear selection list
     */
    clearSelection: function() {

        var need_event = this.selected_objects.length > 0;
        
        for (idx in this.selected_objects) {
            this.selected_objects[idx]._setSelected(false);
        }
        
        this.selected_objects.splice(0, this.selected_objects.length);
        
        if (need_event) this.selectionChanged();
    },
    
    selectionChanged: function() {
        this._fireSelectionChanged();
        
        this.line_points.splice(0, this.line_points.length);
        // if selected any of line objects, then create controls to control it
        if (this.selected_objects.length == 1) {
            var obj = this.selected_objects[0];
            
            if (obj instanceof SCg.ModelEdge || obj instanceof SCg.ModelBus) { /* @todo add contour and bus */
                for (idx in obj.points) {
                    this.line_points.push({pos: obj.points[idx], idx: idx});
                }
            }
        }
        
        this.render.updateLinePoints();
        this.updateObjectsVisual();
    },
    
    // -------- input processing -----------
    onMouseMove: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        this.mouse_pos.x = x;
        this.mouse_pos.y = y;
        
        if ((this.edit_mode == SCgEditMode.SCgModeSelect) && this.focused_object) {
           if (this.focused_object instanceof SCg.ModelBus) {            
                this.focused_object.changePosition(new SCg.Vector3(x, y, 0));
            } else  if (this.focused_object.sc_type & sc_type_node) {
                this.focused_object.setPosition(new SCg.Vector3(x, y, 0));
            } else if (this.focused_object.sc_type & sc_type_contour) {
                this.focused_object.setNewPoint(new SCg.Vector3(x, y, 0));
            }            
            
            this.updateObjectsVisual();
        }
        
        if (this.edit_mode == SCgEditMode.SCgModeEdge || this.edit_mode == SCgEditMode.SCgModeBus 
            || this.edit_mode == SCgEditMode.SCgModeContour) {
            this.render.updateDragLine();
        }
    },
    
    onMouseDown: function(x, y) {

        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing

        // append new line point
        if (!this.pointed_object) {
            var isModeEdge = this.edit_mode == SCgEditMode.SCgModeEdge;
            var isModeContour = this.edit_mode == SCgEditMode.SCgModeContour;
            if (isModeContour || (isModeEdge && this.edge_data.source)) {
                this.drag_line_points.push({x: x, y: y, idx: this.drag_line_points.length});
            }
        }
        
        if (!this.pointed_object && this.edit_mode == SCgEditMode.SCgModeBus && this.bus_data.source) {
            this.drag_line_points.push({x: x, y: y, idx: this.drag_line_points.length});
            this.bus_data.end = {x: x, y: y, idx: this.drag_line_points.length};
        }
    },
    
    onMouseUp: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (!this.pointed_object)
            this.clearSelection();

        this.focused_object = null;
    },
    
    onMouseDoubleClick: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            if (this.pointed_object)
                return; // do nothing
            
            this.createNode(sc_type_node | sc_type_const, new SCg.Vector3(x, y, 0), '');
            this.updateRender();
        }
    },
    
    
    onMouseOverObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        this.pointed_object = obj;
    },
    
    onMouseOutObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        this.pointed_object = null;
    },

    onMouseDownObject: function(obj) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing

        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            this.focused_object = obj;
            if (obj instanceof SCg.ModelContour || obj instanceof SCg.ModelBus) {
                obj.previousPoint = new SCg.Vector2(this.mouse_pos.x, this.mouse_pos.y);
            }
        }

        if (this.edit_mode == SCgEditMode.SCgModeEdge) {

            // start new edge
            if (!this.edge_data.source) {
                this.edge_data.source = obj;
                this.drag_line_points.push({x: this.mouse_pos.x, y: this.mouse_pos.y, idx: this.drag_line_points.length});
            } else {
                // source and target must be not equal
                if (this.edge_data.source != obj) {
                    var edge = this.createEdge(this.edge_data.source, obj, sc_type_arc_pos_const_perm);

                    var mouse_pos = new SCg.Vector2(this.mouse_pos.x, this.mouse_pos.y);
                    var start_pos = new SCg.Vector2(this.drag_line_points[0].x, this.drag_line_points[0].y);
                    edge.setSourceDot(this.edge_data.source.calculateDotPos(start_pos));
                    edge.setTargetDot(obj.calculateDotPos(mouse_pos));

                    if (this.drag_line_points.length > 1) {
                        edge.setPoints(this.drag_line_points.slice(1));
                    }
                    this.edge_data.source = this.edge_data.target = null;

                    this.drag_line_points.splice(0, this.drag_line_points.length);

                    this.updateRender();
                    this.render.updateDragLine();
                }
            }
        }
        if (this.edit_mode == SCgEditMode.SCgModeBus) {
        
            if (!this.bus_data.source && !obj.bus && !(obj instanceof SCg.ModelBus)) {
                this.bus_data.source = obj;
                this.drag_line_points.push({x: this.mouse_pos.x, y: this.mouse_pos.y, idx: this.drag_line_points.length});
            }
        }
    },
    
    onMouseUpObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            // case we moved object from contour
            if (obj.contour && !obj.contour.isNodeInPolygon(obj)) {
                obj.contour.removeChild(obj);
            }

            // case we moved object into the contour
            if (!obj.contour && obj instanceof SCg.ModelNode) {
                for (var i = 0; i < this.contours.length; i++) {
                    if (this.contours[i].isNodeInPolygon(obj)) {
                        this.contours[i].addChild(obj);
                    }
                }
            }

            if (obj == this.focused_object) {
                this.clearSelection();
                this.appendSelection(obj);
                this.updateObjectsVisual();
            }

            this.focused_object = null;
        }
    },
    
    onKeyDown: function(key_code) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return false; // do nothing
        
        // revert changes on escape key
        if (key_code == KeyCode.Escape) {
            if (this.edit_mode == SCgEditMode.SCgModeEdge)
            {
                this.resetEdgeMode();
                return true;
            }
        }
        
        return false;
    },
    
    onKeyUp: function(key_code) {
        if (this.modal != SCgModalMode.SCgModalNone) return false; // do nothing
        
        return false;
    },
    
    // -------- edit --------------
    /**
     * Setup new edit mode for scene. Calls from user interface
     * @param {SCgEditMode} mode New edit mode
     */
    setEditMode: function(mode) {
        
        if (this.edit_mode == mode) return; // do nothing
        
        this.edit_mode = mode;
        
        this.focused_object = null;
        this.edge_data.source = null; this.edge_data.target = null;
        
        this.bus_data.source = null;
        
        this.resetEdgeMode();
    },
    
    /** 
     * Changes modal state of scene. Just for internal usage
     */
    setModal: function(value) {
        this.modal = value;
        this._fireModalChanged();
    },
    
    /**
     * Reset edge creation mode state
     */
    resetEdgeMode: function() {
        this.drag_line_points.splice(0, this.drag_line_points.length);
        this.render.updateDragLine();
        
        this.edge_data.source = this.edge_data.target = null;
    },
    
    /**
     * Revert drag line to specified point. All drag point with index >= idx will be removed
     * @param {Integer} idx Index of drag point to revert.
     */
    revertDragPoint: function(idx) {

        if (this.edit_mode != SCgEditMode.SCgModeEdge && this.edit_mode != SCgEditMode.SCgModeBus && this.edit_mode != SCgEditMode.SCgModeContour) {
            SCgDebug.error('Work with drag point in incorrect edit mode');
            return;
        }
        
        this.drag_line_points.splice(idx, this.drag_line_points.length - idx);
        
        if (this.drag_line_points.length >= 2)
            this.bus_data.end = this.drag_line_points[this.drag_line_points.length - 1];
        else
            this.bus_data.end = null;
        
        if (this.drag_line_points.length == 0) {
            this.edge_data.source = this.edge_data.target = null;
            this.bus_data.source = null;
        }
        this.render.updateDragLine();
    },
    
    /**
     * Update selected line point position
     */
    setLinePointPos: function(idx, pos) {
        if (this.selected_objects.length != 1) {
            SCgDebug.error('Invalid state. Trying to update line point position, when there are no selected objects');
            return;
        }
        
        var edge = this.selected_objects[0];
        if (!(edge instanceof SCg.ModelEdge) && !(edge instanceof SCg.ModelBus)) {
            SCgDebug.error("Selected object isn't an edge");
            return;
        }
        
        if (edge.points.length <= idx) {
            SCgDebug.error('Invalid index of line point');
            return;
        }
        edge.points[idx].x = pos.x;
        edge.points[idx].y = pos.y;
        
        edge.requestUpdate();
        edge.need_update = true;
        edge.need_observer_sync = true;
    
        this.updateObjectsVisual();
        this.render.updateLinePoints();
    },

    finishBusCreation: function() {
        
        var bus = this.createBus(this.bus_data.source);                    
                    
        if (this.drag_line_points.length > 1) {
            bus.setPoints(this.drag_line_points.slice(1));
        }       
        var pos = new SCg.Vector2(this.drag_line_points[0].x, this.drag_line_points[0].y);

        bus.setSourceDot(this.bus_data.source.calculateDotPos(pos));
        bus.setTargetDot(0);
         
        this.bus_data.source = this.bus_data.end = null;

        this.drag_line_points.splice(0, this.drag_line_points.length);

        this.updateRender();
        this.render.updateDragLine();
     },

    createCurrentContour: function() {
        if (this.drag_line_points.length < 3) {
            SCgDebug.error('Set at least 3 points for contour');
            return;
        }

        var polygon =  $.map(this.drag_line_points, function (vertex) {
            return $.extend({}, vertex);
        });

        var contour = new SCg.ModelContour({
            verticies: polygon
        });

        contour.addNodesWhichAreInContourPolygon(this.nodes);
        this.appendContour(contour);
        this.pointed_object = contour;
        this.drag_line_points.splice(0, this.drag_line_points.length);
        this.updateRender();
        this.render.updateDragLine();
    },

    // ------------- events -------------
    _fireSelectionChanged: function() {
        if (this.event_selection_changed)
            this.event_selection_changed();
    },
    
    _fireModalChanged: function() {
        if (this.event_modal_changed)
            this.event_modal_changed();
    }
};


/* --- src/scg-layout.js --- */
var SCgLayoutObjectType = {
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
SCg.LayoutAlgorithm = function(nodes, edges, contours, onTickUpdate) {
    this.nodes = nodes;
    this.edges = edges;
    this.contours = contours;
    this.onTickUpdate = onTickUpdate;
};

SCg.LayoutAlgorithm.prototype = {
    constructor: SCg.LayoutAlgorithm
};

// --------------------------

SCg.LayoutAlgorithmForceBased = function(nodes, edges, contours, onTickUpdate, rect) {
    SCg.LayoutAlgorithm.call(this, nodes, edges, contours, onTickUpdate);
    this.rect = rect;
};

SCg.LayoutAlgorithmForceBased.prototype = Object.create( SCg.LayoutAlgorithm );

SCg.LayoutAlgorithmForceBased.prototype.start = function() {
    // init D3 force layout
    var self = this;
    this.force = d3.layout.force()
        .nodes(this.nodes)
        .links(this.edges)
        .size(this.rect)
	.gravity(0.1)
        .linkDistance(function(edge){
		if (edge.source.type == SCgLayoutObjectType.DotPoint ||
			edge.target.type == SCgLayoutObjectType.DotPoint) {
			return 50;
		}
		
		return 170;
	})
	.linkStrength(function(edge){
		if (edge.source.type == SCgLayoutObjectType.DotPoint ||
			edge.target.type == SCgLayoutObjectType.DotPoint) {
			return 1.0;
		}

		return 0.9;
	})
        .charge(function(node) {
		if (node.type == SCgLayoutObjectType.DotPoint) {
			return 0;
		}
		return -1000;
	})
        .on('tick', function() {
            self.onLayoutTick();
        })
        .start();
};

SCg.LayoutAlgorithmForceBased.prototype.onLayoutTick = function() {
    
    var dots = [];
    for (idx in this.nodes) {
        var node_layout = this.nodes[idx];
        
        if (node_layout.type == SCgLayoutObjectType.Node) {
            node_layout.object.setPosition(new SCg.Vector3(node_layout.x, node_layout.y, 0));
        } else
        {
            if (node_layout.type == SCgLayoutObjectType.DotPoint) {
                dots.push(node_layout);
            }
        }
    }
    
    // setup dot points positions 
    for (idx in dots) {
        var dot = dots[idx];
        
        var edge = dot.object.target;
        if (dot.source)
            edge = dot.object.source;
        
        dot.x = edge.position.x;
        dot.y = edge.position.y;
    }
    
    this.onTickUpdate();
};


// ------------------------------------

SCg.LayoutManager = function() {

};

SCg.LayoutManager.prototype = {
    constructor: SCg.LayoutManager
};

SCg.LayoutManager.prototype.init = function(scene) {
    this.scene = scene;
    this.nodes = null;
    this.edges = null;
    
    this.algorithm = null;
};

/**
 * Prepare objects for layout
 */
SCg.LayoutManager.prototype.prepareObjects = function() {

    this.nodes = new Array();
    this.edges = new Array();
    var objDict = {};
    
    // first of all we need to collect objects from scene, and build them representation for layout
    for (idx in this.scene.nodes) {
        var node = this.scene.nodes[idx];
        var obj = new Object();
        
        obj.x = node.position.x;
        obj.y = node.position.y;
        obj.object = node;
        obj.type = SCgLayoutObjectType.Node;
        
        objDict[node.id] = obj;
        this.nodes.push(obj);
    }
    
    for (idx in this.scene.edges) {
        var edge = this.scene.edges[idx];
        var obj = new Object();
        
        obj.object = edge;
        obj.type = SCgLayoutObjectType.Edge;
        
        objDict[edge.id] = obj;
        this.edges.push(obj);
    }
    
    // store begin and end for edges
    for (idx in this.edges) {
        edge = this.edges[idx];
        
        source = objDict[edge.object.source.id];
        target = objDict[edge.object.target.id];
        
        function getEdgeObj(srcObj, isSource) {
            if (srcObj.type == SCgLayoutObjectType.Edge) {
                var obj = new Object();
                obj.type = SCgLayoutObjectType.DotPoint;
                obj.object = srcObj.object;
                obj.source = isSource;
            
                return obj;
            }
            return srcObj;
        };
                
        edge.source = getEdgeObj(source, true);
        edge.target = getEdgeObj(target, false);
        
        if (edge.source != source)
            this.nodes.push(edge.source);
        if (edge.target != target)
            this.nodes.push(edge.target);
    }
    
};

/**
 * Starts layout in scene
 */
SCg.LayoutManager.prototype.doLayout = function() {
    var self = this;
    
    this.prepareObjects();
    this.algorithm = new SCg.LayoutAlgorithmForceBased(this.nodes, this.edges, null, 
                                                        $.proxy(this.onTickUpdate, this), 
                                                        this.scene.getContainerSize());
    this.algorithm.start();
};

SCg.LayoutManager.prototype.onTickUpdate = function() { 
    this.scene.updateObjectsVisual();
};


/* --- src/scg-component.js --- */
SCgComponent = {
    ext_lang: 'scg_code',
    formats: ['format_scg_json'],
    factory: function(sandbox) {
        return new scgViewerWindow(sandbox);
    }
};


/**
 * scgViewerWindow
 * @param config
 * @constructor
 */
var scgViewerWindow = function(sandbox){
    this._initWindow(sandbox);
};

scgViewerWindow.prototype = {

    /**
     * scgViewer Window init
     * @param config
     * @private
     */
    _initWindow : function(sandbox){

        /**
         * Container for render graph
         * @type {String}
         */
        this.domContainer = sandbox.container;
        this.sandbox = sandbox;

        this.editor = new SCg.Editor();
        this.editor.init({containerId: sandbox.container});
        
        // delegate event handlers
        this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
        this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
        this.sandbox.eventApplyTranslation = $.proxy(this.applyTranslation, this);

        this.sandbox.updateContent();
    },

    /**
     * Set new data in viewer
     * @param {Object} data
     */
    receiveData : function(data) {
        var dfd = new jQuery.Deferred();

        this._buildGraph(data);

        dfd.resolve();
        return dfd.promise();
    },

    /**
     * Build scGraph from JSON
     * @param {Object} data
     * @return {scGraph}
     * @private
     */
    _buildGraph : function(data){
        
        var elements = {};
        var edges = new Array();
        for (var i = 0; i < data.length; i++) {
            var el = data[i];
            
            if (elements.hasOwnProperty(el.id))
                continue;
                
            if (this.editor.scene.objects.hasOwnProperty(el.id)) {
                elements[el.id] = this.editor.scene.objects[el.id];
                continue;
            }
            
            if (el.el_type & sc_type_node || el.el_type & sc_type_link) {
                var model_node = this.editor.scene.createNode(el.el_type, new SCg.Vector3(10 * Math.random(), 10 * Math.random(), 0), '');
                model_node.setScAddr(el.id);
                
                elements[el.id] = model_node;
            } else if (el.el_type & sc_type_arc_mask) {
                edges.push(el);
            }
        }
        
        // create edges
        var founded = true;
        while (edges.length > 0 && founded) {
            founded = false;
            for (idx in edges) {
                var obj = edges[idx];
                var beginId = obj.begin;
                var endId = obj.end;
                // try to get begin and end object for arc
                if (elements.hasOwnProperty(beginId) && elements.hasOwnProperty(endId)) {
                    var beginNode = elements[beginId];
                    var endNode = elements[endId];
                    
                    founded = true;
                    edges.splice(idx, 1);
                    
                    var model_edge = this.editor.scene.createEdge(beginNode, endNode, obj.el_type);
                    model_edge.setScAddr(obj.id);
                    
                    elements[obj.id] = model_edge;
                } 
            }
        }
        
        if (edges.length > 0)
            alert("error");
        
        this.editor.render.update();
        this.editor.scene.layout();
    },

    /**
     * Destroy window
     * @return {Boolean}
     */
    destroy : function(){
        delete this.editor;
        return true;
    },

    getObjectsToTranslate : function(){      
        return this.editor.scene.getScAddrs();
    },

    applyTranslation: function(namesMap){
        for (addr in namesMap) {
            var obj = this.editor.scene.getObjectByScAddr(addr);
            if (obj) {
                obj.text = namesMap[addr];
            }
        }
            
        this.editor.render.updateTexts();
    }

};


SCWeb.core.ComponentManager.appendComponentInitialize(SCgComponent);


