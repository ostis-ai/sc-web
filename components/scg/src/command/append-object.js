SCgCommandAppendObject = function (object, scene) {
    this.object = object;
    this.scene = scene;
};

SCgCommandAppendObject.prototype = {

    constructor: SCgCommandAppendObject,


    undo: function () {
        if (this.object) {
            var idx = this.scene.selected_objects.indexOf(this.object);
            this.scene.selected_objects.splice(idx, 1);
            this.object._setSelected(false);
            this.scene.edit.onSelectionChanged();
            this.scene.line_points = [];
        }
        this.scene.removeObject(this.object);
    },

    execute: function () {
        this.scene.appendObject(this.object);
        this.object.update();
    }

};
