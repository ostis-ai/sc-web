SCgBusListener = function (scene) {
    this.scene = scene;
};

SCgBusListener.prototype = {

    constructor: SCgBusListener,

    onMouseMove: function (x, y) {
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        this.scene.render.updateDragLine();
        return true;
    },

    onMouseDown: function (x, y) {
        if (!this.scene.pointed_object) {
            if (this.scene.bus_data.source) {
                this.scene.drag_line_points.push({x: x, y: y, idx: this.scene.drag_line_points.length});
                this.scene.bus_data.end = {x: x, y: y, idx: this.scene.drag_line_points.length};
                return true;
            }
        }
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        return false;
    },

    onMouseDownObject: function (obj) {
        if (!this.scene.bus_data.source && !obj.bus && !(obj instanceof SCg.ModelBus)) {
            this.scene.bus_data.source = obj;
            this.scene.drag_line_points.push({
                x: this.scene.mouse_pos.x,
                y: this.scene.mouse_pos.y,
                idx: this.scene.drag_line_points.length
            });
            return true;
        } else {
            if (obj instanceof SCg.ModelContour) {
                var x = this.scene.mouse_pos.x;
                var y = this.scene.mouse_pos.y;
                this.scene.drag_line_points.push({x: x, y: y, idx: this.scene.drag_line_points.length});
                this.scene.bus_data.end = {x: x, y: y, idx: this.scene.drag_line_points.length};
                return true;
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
    },

    finishCreation: function () {
        this.scene.commandManager.execute(new SCgCommandCreateBus(this.scene.bus_data.source, this.scene));
    }

};
