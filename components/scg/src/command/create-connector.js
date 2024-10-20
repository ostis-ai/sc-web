SCgCommandCreateConnector = function (source, target, scene) {
    this.source = source;
    this.target = target;
    this.scene = scene;
    this.connector = null;
};

SCgCommandCreateConnector.prototype = {

    constructor: SCgCommandCreateConnector,

    undo: function () {
        if (this.connector.is_selected) {
            var idx = this.scene.selected_objects.indexOf(this.connector);
            this.scene.selected_objects.splice(idx, 1);
            this.connector._setSelected(false);
            this.scene.edit.onSelectionChanged();
            this.scene.line_points = [];
        }
        this.scene.removeObject(this.connector);
    },

    execute: function () {
        var scene = this.scene;
        if (this.connector == null) {
            this.connector = SCg.Creator.generateConnector(this.source, this.target, SCgTypeConnectorNow);
            scene.appendConnector(this.connector);
            var mouse_pos = new SCg.Vector2(scene.mouse_pos.x, scene.mouse_pos.y);
            var start_pos = new SCg.Vector2(scene.drag_line_points[0].x, scene.drag_line_points[0].y);
            this.connector.setSourceDot(this.source.calculateDotPos(start_pos));
            this.connector.setTargetDot(this.target.calculateDotPos(mouse_pos));
            if (scene.drag_line_points.length > 1) this.connector.setPoints(scene.drag_line_points.slice(1));
            scene.connector_data.source = scene.connector_data.target = null;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
            this.connector.need_update = true;
            scene.updateObjectsVisual();
            scene.clearSelection();
            scene.appendSelection(this.connector);
        } else {
            scene.appendConnector(this.connector);
            this.connector.update();
        }
    }

};
