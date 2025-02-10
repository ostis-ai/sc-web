ScgObjectBuilder = {
    scg_objects: {},
    gwf_objects: {},
    commandList: [],
    commandSetAddrList: [],
    scene: null,

    buildObjects: function (gwf_objects) {
        this.gwf_objects = gwf_objects;
        for (let gwf_object_id in gwf_objects) {
            let gwf_object = gwf_objects[gwf_object_id];
            if (!(gwf_object.attributes.id in this.scg_objects)) {
                const scg_object = gwf_object.buildObject({
                    scene: this.scene,
                    builder: this
                });
                this.scg_objects[gwf_object.attributes.id] = scg_object;
                this.commandList.push(new SCgCommandAppendObject(scg_object, this.scene));
            }
        }
        this.scene.commandManager.execute(new SCgWrapperCommand(this.commandList), true);
        this.getScAddrsForObjects();
        this.scene.clearSelection();
        this.emptyObjects();
    },

    getOrCreate: function (gwf_object_id) {
        if (!(gwf_object_id in this.scg_objects)) {
            let gwf_object = this.gwf_objects[gwf_object_id];
            this.scg_objects[gwf_object_id] = gwf_object.buildObject({
                scene: this.scene,
                builder: this
            });
            this.commandList.push(new SCgCommandAppendObject(this.scg_objects[gwf_object_id], this.scene));
        }
        return this.scg_objects[gwf_object_id];
    },

    getScAddrsForObjects: async function () {
        var self = this;
        var nodes = this.getAllNodesFromObjects();
        var promises = this.trySetScAddrForNodes(nodes);
        promises = await Promise.resolve(promises);
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
            if (node instanceof SCg.ModelNode && !node.sc_addr) {
                nodes.push(node);
            }
        });
        return nodes;
    },

    trySetScAddrForNodes: async function (nodes) {
        var self = this;
        var edit = this.scene.edit;
        var promises = [];
        nodes.forEach(node => {
            if (node.sc_addr) {
                return;
            }
            promises.push(new Promise(async (resolve) => {
                const idtf = node.text;
                if (idtf?.length) {
                    await edit.autocompletionVariants(idtf, async (keys) => {
                        var found = false;
                        for (const key of keys)
                        {
                            if (idtf === key) {
                                foundAddr = await searchNodeByAnyIdentifier(idtf);
                                self.commandSetAddrList.push(new SCgCommandGetNodeFromMemory(
                                    node,
                                    node.sc_type,
                                    idtf,
                                    foundAddr.value,
                                    self.scene)
                                );
                                found = true;
                                break;
                            }
                        }
                        if (found) {
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
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
