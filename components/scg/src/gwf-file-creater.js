GwfFileCreate = {

    scene: null,
    fileString: null,

    createFile: function (scene) {
        this.scene = scene;
        this.fileString = "";
        var self = this;
        this.addHeaderFile();
        this.scene.contours.forEach(function (counter) {
            self.createContour(counter);
        });
        this.scene.nodes.forEach(function (node) {
            self.createNode(node);
        });
        /*this.scene.buses.forEach(function (bus) {
            self.createBus(bus);
        });
        this.scene.links.forEach(function (link) {
            self.createLink(link);
        });
        this.scene.edges.forEach(function (edge) {
            self.createEdge(edge);
        });*/
        this.addEndFile();
        return this.fileString;
    },
    
    addHeaderFile: function () {
        this.fileString +=
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<GWF version="2.0">\n' +
            '    <staticSector>\n';
    },

    addEndFile: function () {
        this.fileString +=
            '    </staticSector>\n' +
            '</GWF>\n';
    },

    createNode: function (node) {
        this.fileString +=
        '       <node type="' + this.getTypeNode(node) + '" idtf="' + this.getIdtf(node) + '" shapeColor="0" id="' + this.getIdObject(node) + '" parent="' + this.haveParent(node) + '" left="0" top="0" right="16.125" bottom="25" textColor="164" text_angle="0" text_font="Times New Roman [Arial]" font_size="10" x="' + node.position.x + '" y="' + node.position.y + '" haveBus="' + this.haveBus(node) + '" idtf_pos="0">\n' +
        '           <content type="0" mime_type="" content_visibility="false" file_name=""/>\n' +
        '       </node>\n';
    },

    createEdge: function () {

    },

    createBus: function () {

    },

    createContour: function (contour) {
        this.fileString +=
        '       <contour type="" idtf="' + this.getIdtf(contour) + '" shapeColor="255" id="' + this.getIdObject(contour) + '" parent="' + this.haveParent(contour) + '" left="0" top="0" right="16.125" bottom="25" textColor="164" text_angle="0" text_font="Times New Roman [Arial]" font_size="10">\n';
        this.addPoints(contour);
        this.fileString +=
        '       </contour>\n';
    },

    createLink: function () {

    },

    addPoints: function (object) {
        var self = this;
        this.fileString +=
        '           <points>\n';
        object.points.forEach(function (point) {
            self.fileString +=
            '               <point x="' + point.x + '" y="' + point.y + '"/>\n';
        });
        this.fileString +=
        '           </points>\n';
    },

    getTypeNode: function (node) {
        for (var key in GwfObjectInfoReader.gwf_type_to_scg_type) {
            if (GwfObjectInfoReader.gwf_type_to_scg_type[key] == node.sc_type) {
                return key
            }
        }
        console.log("Error getType");
        console.log(node);
        return "node/const/general_node";
    },

    getIdObject: function (object) {
        return object.id + 100;
    },

    getIdtf: function (object) {
        if (object.text != null) {
            return object.text;
        } else {
            return "";
        }
    },

    haveBus: function (object) {
        if (object.bus){
            return "true";
        } else {
            return "false";
        }
    },

    haveParent: function (object) {
        if (object.contour != null){
            return this.getIdObject(object.contour);
        } else {
            return 0;
        }
    }
};
