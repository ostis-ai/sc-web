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
        }
        return false;
    },

    onMouseUpObject: function(obj) {
        return true;
    },

    onKeyDown: function(key_code) {
        return false;
    },

    onKeyUp: function(key_code) {
        return false;
    },

    finishCreation: function () {
        var scene = this.scene;
        var bus = scene.createBus(scene.bus_data.source);
        scene.commandManager.addCommand(new SCgCommandCreateBus(bus));
        if (scene.drag_line_points.length > 1) {
            bus.setPoints(scene.drag_line_points.slice(1));
        }
        var pos = new SCg.Vector2(scene.drag_line_points[0].x, scene.drag_line_points[0].y);
        bus.setSourceDot(scene.bus_data.source.calculateDotPos(pos));
        bus.setTargetDot(0);
        scene.bus_data.source = scene.bus_data.end = null;
        scene.drag_line_points.splice(0, scene.drag_line_points.length);
        scene.updateRender();
        scene.render.updateDragLine();
    }

};
