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