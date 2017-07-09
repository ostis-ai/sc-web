SCgCommandCreateBus = function (source, scene) {
    this.source = source;
    this.scene = scene;
    this.bus = null;
};

SCgCommandCreateBus.prototype = {

    constructor: SCgCommandCreateBus,

    undo: function () {
        if (this.bus.is_selected) {
            var idx = this.scene.selected_objects.indexOf(this.bus);
            this.scene.selected_objects.splice(idx, 1);
            this.bus._setSelected(false);
            this.scene.edit.onSelectionChanged();
            this.scene.line_points = [];
        }
        this.scene.removeObject(this.bus);
    },

    execute: function () {
        var scene = this.scene;
        if (this.bus == null) {
            this.bus = SCg.Creator.createBus(this.source);
            scene.appendBus(this.bus);
            if (scene.drag_line_points.length > 1) this.bus.setPoints(scene.drag_line_points.slice(1));
            var pos = new SCg.Vector2(scene.drag_line_points[0].x, scene.drag_line_points[0].y);
            this.bus.setSourceDot(this.source.calculateDotPos(pos));
            this.bus.setTargetDot(0);
            scene.bus_data.source = scene.bus_data.end = null;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
        } else {
            scene.appendBus(this.bus);
            this.bus.setSource(this.source);
            this.bus.update();
        }

    }

};
