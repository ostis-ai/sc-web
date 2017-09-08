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
        this.scene.buses.forEach(function (bus) {
            self.createBus(bus);
        });
        this.scene.links.forEach(function (link) {
            self.createLink(link);
        });
        this.scene.edges.forEach(function (edge) {
            self.createEdge(edge);
        });
        this.addEndFile();
        return this.fileString;
    },

    createFileWithSelectedObject: function (scene) {

        function selectedFilter(object) {
            return object.is_selected;
        }

        function selectedFilterForBus(bus) {
            return bus.is_selected && bus.source.is_selected;
        }

        function selectedFilterForEdges(edge) {
            return edge.is_selected && edge.source.is_selected && edge.target.is_selected;
        }

        function fixParents(text) {
            var results = text.match(/parent="(\d+)"/g) || [];
            results.forEach(function (string) {
                var id = string.match(/\d+/)[0] || 0;
                if (id !== 0) {
                    var index = text.indexOf('id="' + id + '"');
                    if (index == -1) {
                        text = text.replace(new RegExp('parent="' + id + '"', 'g'), 'parent="0"');
                    }
                }
            });
            return text;
        }

        this.scene = scene;
        this.fileString = "";
        var self = this;
        this.addHeaderFile();
        this.scene.contours.filter(selectedFilter).forEach(function (counter) {
            self.createContour(counter);
        });
        this.scene.nodes.filter(selectedFilter).forEach(function (node) {
            self.createNode(node);
        });
        this.scene.buses.filter(selectedFilterForBus).forEach(function (bus) {
            self.createBus(bus);
        });
        this.scene.links.filter(selectedFilter).forEach(function (link) {
            self.createLink(link);
        });
        this.scene.edges.filter(selectedFilterForEdges).forEach(function (edge) {
            self.createEdge(edge);
        });
        this.addEndFile();
        this.fileString = fixParents(this.fileString);
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
            '       <node type="' + this.getTypeObject(node) + '" idtf="' + this.getIdtf(node) + '" shapeColor="0" id="' + this.getIdObject(node) + '" parent="' + this.haveParent(node) + '" left="0" top="0" right="16.125" bottom="25" textColor="164" text_angle="0" text_font="Times New Roman [Arial]" font_size="10" x="' + node.position.x + '" y="' + node.position.y + '" haveBus="' + this.haveBus(node) + '" idtf_pos="0">\n' +
            '           <content type="0" mime_type="" content_visibility="false" file_name=""/>\n' +
            '       </node>\n';
    },

    createEdge: function (edge) {
        this.fileString +=
            '       <arc type="' + this.getTypeObject(edge) + '" idtf="" shapeColor="0" id="' + this.getIdObject(edge) + '" parent="' + this.haveParent(edge) + '" id_b="' + this.getIdObject(edge.source) + '" id_e="' + this.getIdObject(edge.target) + '" b_x="' + edge.source_pos.x + '" b_y="' + edge.source_pos.y + '" e_x="' + edge.target_pos.x + '" e_y="' + edge.target_pos.y + '" dotBBalance="' + edge.source_dot + '" dotEBalance="' + edge.target_dot + '">\n';
        this.addPoints(edge);
        this.fileString +=
            '       </arc>\n';
    },

    createBus: function (bus) {
        this.fileString +=
            '       <bus type="" idtf="" shapeColor="0" id="' + this.getIdBus(bus) + '" parent="' + this.haveParent(bus) + '" owner="' + this.getIdObject(bus.source) + '" b_x="' + bus.source_pos.x + '" b_y="' + bus.source_pos.y + '" e_x="' + bus.target_pos.x + '" e_y="' + bus.target_pos.y + '">\n';
        this.addPointsBus(bus);
        this.fileString +=
            '       </bus>\n';
    },

    createContour: function (contour) {
        this.fileString +=
            '       <contour type="" idtf="' + this.getIdtf(contour) + '" shapeColor="255" id="' + this.getIdObject(contour) + '" parent="' + this.haveParent(contour) + '" left="0" top="0" right="16.125" bottom="25" textColor="164" text_angle="0" text_font="Times New Roman [Arial]" font_size="10">\n';
        this.addPoints(contour);
        this.fileString +=
            '       </contour>\n';
    },

    createLink: function (node) {
        this.fileString +=
            '       <node type="node/const/general_node" idtf="" shapeColor="0" id="' + this.getIdObject(node) + '" parent="' + this.haveParent(node) + '" left="0" top="0" right="16.125" bottom="25" textColor="164" text_angle="0" text_font="Times New Roman [Arial]" font_size="10" x="' + node.position.x + '" y="' + node.position.y + '" haveBus="' + this.haveBus(node) + '" idtf_pos="0">\n' +
            '           <content type="' + this.getLinkType(node) + '" mime_type="' + this.getLinkMimeType(node) + '" content_visibility="true" file_name=""><![CDATA[' + node.content + ']]></content>\n' +
            '       </node>\n';
    },

    addPoints: function (object) {
        var self = this;
        if (object instanceof SCg.ModelBus) {
            this.addPointsBus(object);
        } else {
            if (object.points.length > 0) {
                this.fileString +=
                    '           <points>\n';
                object.points.forEach(function (point) {
                    self.fileString +=
                        '               <point x="' + point.x + '" y="' + point.y + '"/>\n';
                });
                this.fileString +=
                    '           </points>\n';
            } else {
                this.fileString +=
                    '           <points/>\n';
            }
        }
    },

    addPointsBus: function (object) {
        var self = this;
        if (object.points.length > 1) {
            this.fileString +=
                '           <points>\n';
            for (var point = 0; point < object.points.length - 1; point++) {
                self.fileString +=
                    '               <point x="' + object.points[point].x + '" y="' + object.points[point].y + '"/>\n';
            }
            this.fileString +=
                '           </points>\n';
        } else {
            this.fileString +=
                '           <points/>\n';
        }
    },

    getTypeObject: function (object) {
        for (var key in GwfObjectInfoReader.gwf_type_to_scg_type) {
            if (GwfObjectInfoReader.gwf_type_to_scg_type[key] == object.sc_type) {
                return key
            }
        }
    },

    getIdObject: function (object) {
        if (object instanceof SCg.ModelBus) {
            return this.getIdBus(object);
        } else {
            return object.id + 100;
        }
    },

    getIdBus: function (bus) {
        return bus.id_bus + 100;
    },

    getIdtf: function (object) {
        if (object.text != null) {
            return object.text;
        } else {
            return "";
        }
    },

    getLinkType: function (object) {
        // TODO add work with file(example type="4" mime_type="image/png")
        if (object.contentType == 'string') {
            return "1";
        }
        if (object.contentType == 'html') {    // KBE not support HTML, save as string
            return "1";
        } else {
            return "3";
        }
    },

    getLinkMimeType: function (object) {
        // TODO add work with file(example type="4" mime_type="image/png")
        return "content/term";
    },

    haveBus: function (object) {
        if (object.bus) {
            return "true";
        } else {
            return "false";
        }
    },

    haveParent: function (object) {
        if (object.contour != null) {
            return this.getIdObject(object.contour);
        } else {
            return 0;
        }
    }
};
