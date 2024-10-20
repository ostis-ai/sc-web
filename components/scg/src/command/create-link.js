SCgCommandCreateLink = function (x, y, scene) {
    this.x = x;
    this.y = y;
    this.scene = scene;
    this.link = null;
};

SCgCommandCreateLink.prototype = {

    constructor: SCgCommandCreateLink,

    undo: function () {
        if (this.link.is_selected) {
            const idx = this.scene.selected_objects.indexOf(this.link);
            this.scene.selected_objects.splice(idx, 1);
            this.link._setSelected(false);
            this.scene.edit.onSelectionChanged();
        }
        this.scene.removeObject(this.link);
    },

    execute: function () {
        if (this.link == null) {
            this.link = SCg.Creator.generateLink(sc_type_node_link | sc_type_const, new SCg.Vector3(this.x, this.y, 0), this.scene.links.length);
            this.scene.appendLink(this.link);
            this.scene.updateRender();
            this.scene.clearSelection();
            this.scene.appendSelection(this.link);
        } else {
            this.scene.appendLink(this.link);
        }
    }

};
