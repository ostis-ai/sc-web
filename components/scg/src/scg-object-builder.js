ScgObjectBuilder = {
    scg_objects: {},
    gwf_objects: {},
    commandList: [],
    commandSetAddrList: [],
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
                this.commandList.push(new SCgCommandAppendObject(scg_object, this.scene));
            }
        }
        this.scene.commandManager.execute(new SCgWrapperCommand(this.commandList), true);
        this.getScAddrsForObjects();
        this.emptyObjects();
    },

    getOrCreate: function (gwf_object_id) {
        if (gwf_object_id in this.scg_objects == false) {
            var gwf_object = this.gwf_objects[gwf_object_id];
            this.scg_objects[gwf_object_id] = gwf_object.buildObject({
                scene: this.scene,
                builder: this
            });
            this.commandList.push(new SCgCommandAppendObject(this.scg_objects[gwf_object_id], this.scene));
        }
        return this.scg_objects[gwf_object_id];
    },

    getScAddrsForObjects: function () {
        var self = this;
        var nodes = this.getAllNodesFromObjects();
        var promises = this.trySetScAddrForNodes(nodes);
        Promise.all(promises).then(function () {
            self.scene.commandManager.execute(new SCgWrapperCommand(self.commandSetAddrList));
            self.commandSetAddrList = [];
        });
    },

    getAllNodesFromObjects: function () {
        var self = this;
        var nodes = [];
        Object.keys(this.scg_objects).forEach(function (gwf_object_id) {
            var node = self.scg_objects[gwf_object_id];
            if (node instanceof SCg.ModelNode) {
                nodes.push(node);
            }
        });
        return nodes;
    },

    trySetScAddrForNodes: function (nodes) {
        var self = this;
        var edit = this.scene.edit;
        var promises = [];
        nodes.forEach(node => {
            promises.push(new Promise((resolve) => {
                const idtf = node.text;
                if (idtf?.length) {
                    edit.autocompletionVariants(idtf, (keys) => {
                        keys.some((string) => {
                            if (idtf === string) {
                                searchNodeByAnyIdentifier(idtf).then((foundAddr) => {
                                    self.commandSetAddrList.push(new SCgCommandGetNodeFromMemory(
                                        node,
                                        node.sc_type,
                                        idtf,
                                        foundAddr.value,
                                        self.scene)
                                    );
                                });
                                return true;
                            }
                            return false
                        });
                    });
                }
                resolve(node);
            }));
        });
        return promises;
    },

    emptyObjects: function () {
        this.gwf_objects = {};
        this.scg_objects = {};
        this.commandList = [];
    }
};