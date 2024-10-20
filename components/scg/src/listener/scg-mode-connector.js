SCgConnectorListener = function (scene) {
    this.scene = scene;
};

SCgConnectorListener.prototype = {

    constructor: SCgConnectorListener,

    onMouseMove: function (x, y) {
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        this.scene.render.updateDragLine();
        return true;
    },

    onMouseDown: function (x, y) {
        if (!this.scene.pointed_object) {
            if (this.scene.connector_data.source) {
                this.scene.drag_line_points.push({x: x, y: y, idx: this.scene.drag_line_points.length});
                return true;
            }
        }
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        return false;
    },

    onMouseDownObject: function (obj) {
        var scene = this.scene;
        if (!scene.connector_data.source) {
            scene.connector_data.source = obj;
            scene.drag_line_points.push({
                x: scene.mouse_pos.x,
                y: scene.mouse_pos.y,
                idx: scene.drag_line_points.length
            });
            return true;
        } else {
            // source and target must be not equal
            if (scene.connector_data.source != obj) {
                if (!(obj instanceof SCg.ModelContour && obj.isNodeInPolygon(scene.connector_data.source))) {
                    scene.commandManager.execute(new SCgCommandCreateConnector(scene.connector_data.source,
                        obj,
                        this.scene));
                    return true;
                } else {
                    scene.drag_line_points.push({
                        x: scene.mouse_pos.x,
                        y: scene.mouse_pos.y,
                        idx: scene.drag_line_points.length
                    });
                    return true;
                }
            } else {
                scene.connector_data.source = scene.connector_data.target = null;
                scene.drag_line_points.splice(0, scene.drag_line_points.length);
                scene.clearSelection();
                scene.appendSelection(obj);
            }
        }
        return false;
    },

    onMouseUpObject: function (obj) {
        return true;
    },

    onKeyDown: function (event) {
        if (event.which == KeyCode.Escape) {
            this.scene.revertDragPoint(0);
            return true;
        }
        return false;
    },

    onKeyUp: function (event) {
        return false;
    }

};
