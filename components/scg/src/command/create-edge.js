SCgCommandCreateEdge = function (source, target, scene) {
    this.source = source;
    this.target = target;
    this.scene = scene;
    this.edge = null;
};

SCgCommandCreateEdge.prototype = {

    constructor: SCgCommandCreateEdge,

    undo: function () {
        if (this.edge.is_selected) {
            var idx = this.scene.selected_objects.indexOf(this.edge);
            this.scene.selected_objects.splice(idx, 1);
            this.edge._setSelected(false);
            this.scene.edit.onSelectionChanged();
            this.scene.line_points = [];
        }
        this.scene.removeObject(this.edge);
    },

    execute: function () {
        var scene = this.scene;
        if (this.edge == null) {
            this.edge = SCg.Creator.createEdge(this.source, this.target, SCgTypeEdgeNow);
            scene.appendEdge(this.edge);
            var mouse_pos = new SCg.Vector2(scene.mouse_pos.x, scene.mouse_pos.y);
            var start_pos = new SCg.Vector2(scene.drag_line_points[0].x, scene.drag_line_points[0].y);
            this.edge.setSourceDot(this.source.calculateDotPos(start_pos));
            this.edge.setTargetDot(this.target.calculateDotPos(mouse_pos));
            if (scene.drag_line_points.length > 1) this.edge.setPoints(scene.drag_line_points.slice(1));
            scene.edge_data.source = scene.edge_data.target = null;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
            this.edge.need_update = true;
            scene.updateObjectsVisual();
            scene.clearSelection();
            scene.appendSelection(this.edge);
        } else {
            scene.appendEdge(this.edge);
            this.edge.update();
        }
    }

};
