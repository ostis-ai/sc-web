SCgEdgeListener = function (scene) {
    this.scene = scene;
};

SCgEdgeListener.prototype = {

    constructor: SCgEdgeListener,

    onMouseMove: function (x, y) {
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        this.scene.render.updateDragLine();
        return true;
    },

    onMouseDown: function (x, y) {
        if (!this.scene.pointed_object) {
            if (this.scene.edge_data.source) {
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
        if (!scene.edge_data.source) {
            scene.edge_data.source = obj;
            scene.drag_line_points.push({
                x: scene.mouse_pos.x,
                y: scene.mouse_pos.y,
                idx: scene.drag_line_points.length
            });
            return true;
        } else {
            // source and target must be not equal
            if (scene.edge_data.source != obj) {
                scene.commandManager.execute(new SCgCommandCreateEdge(scene.edge_data.source,
                                                                        obj,
                                                                        SCgTypeEdgeNow,
                                                                        this.scene));
                return true;
            }
        }
        return false;
    },

    onMouseUpObject: function(obj) {
        return true;
    },

    onKeyDown: function (key_code) {
        if (key_code == KeyCode.Escape) {
            this.scene.resetEdgeMode();
            return true;
        }
        return false;
    },

    onKeyUp: function(key_code) {
        return false;
    }

};
