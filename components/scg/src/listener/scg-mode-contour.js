SCgContourListener = function(scene) {
    this.scene = scene;
};

SCgContourListener.prototype = {

    constructor: SCgContourListener,

    onMouseMove: function(x, y) {
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        this.scene.render.updateDragLine();
        return true;
    },

    onMouseDown: function(x, y) {
        if (!this.scene.pointed_object) {
            this.scene.drag_line_points.push({x: x, y: y, idx: this.scene.drag_line_points.length});
            return true;
        }
        return false;
    },

    onMouseDoubleClick: function(x, y) {
        return false;
    },

    onMouseDownObject: function(obj) {
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
        var polygon = $.map(scene.drag_line_points, function (vertex) {
            return $.extend({}, vertex);
        });
        var contour = new SCg.ModelContour({ verticies: polygon });
        scene.commandManager.addCommand(new SCgCommandCreateContour(contour));
        scene.appendContour(contour);
        scene.pointed_object = contour;
        scene.drag_line_points.splice(0, scene.drag_line_points.length);
        scene.updateRender();
        scene.render.updateDragLine();
    }

};
