GwfObjectInfoReader = {

    objects_info: {},
    errors: [],

    gwf_type_to_scg_type: {
        "node/-/-/not_define": sc_type_node,

        "node/const/perm/general": sc_type_node | sc_type_const,
        "node/const/perm/tuple": sc_type_node | sc_type_const | sc_type_node_tuple,
        "node/const/perm/struct": sc_type_node | sc_type_const | sc_type_node_struct,
        "node/const/perm/role": sc_type_node | sc_type_const | sc_type_node_role,
        "node/const/perm/relation": sc_type_node | sc_type_const | sc_type_node_norole,
        "node/const/perm/terminal": sc_type_node | sc_type_const | sc_type_node_material,
        "node/const/perm/group": sc_type_node | sc_type_const | sc_type_node_class,

        "node/var/perm/general": sc_type_node | sc_type_var,
        "node/var/perm/tuple": sc_type_node | sc_type_var | sc_type_node_tuple,
        "node/var/perm/struct": sc_type_node | sc_type_var | sc_type_node_struct,
        "node/var/perm/role": sc_type_node | sc_type_var | sc_type_node_role,
        "node/var/perm/relation": sc_type_node | sc_type_var | sc_type_node_norole,
        "node/var/perm/terminal": sc_type_node | sc_type_var | sc_type_node_material,
        "node/var/perm/group": sc_type_node | sc_type_var | sc_type_node_class,

        "pair/const/fuz/temp/orient/membership": sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp,
        "pair/const/fuz/perm/orient/membership": sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm,
        "pair/const/pos/temp/orient/membership": sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp,
        "pair/const/pos/perm/orient/membership": sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm,
        "pair/const/neg/temp/orient/membership": sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp,
        "pair/const/neg/perm/orient/membership": sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm,
        "pair/const/-/perm/orient": sc_type_arc_common | sc_type_const,
        "pair/const/-/perm/noorien": sc_type_edge_common | sc_type_const,
        "pair/-/-/-/orient": sc_type_arc_common,

        "pair/var/-/perm/orient": sc_type_arc_common | sc_type_var,
        "pair/var/fuz/perm/orient/membership": sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm,
        "pair/var/pos/perm/orient/membership": sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm,
        "pair/var/neg/perm/orient/membership": sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm,
        "pair/var/-/perm/noorien": sc_type_edge_common | sc_type_var,
        "pair/-/-/-/noorient": sc_type_edge_common
    },

    read: function (strs) {
        this.objects_info = {};
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
        var content = node.getElementsByTagName("content");
        var parsed_node;
        if (content[0].textContent == "") {
            parsed_node = new GwfObjectNode(null);
        } else {
            parsed_node = new GwfObjectLink(null);
        }
        if (parsed_node.parseObject({gwf_object: node, reader: this}) == false)
            return false;
        this.objects_info[parsed_node.id] = parsed_node;

    },

    parseBus: function (bus) {
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
