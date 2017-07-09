SCgContourListener = function (scene) {
    this.scene = scene;
};

SCgContourListener.prototype = {

    constructor: SCgContourListener,

    onMouseMove: function (x, y) {
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        this.scene.render.updateDragLine();
        return true;
    },

    onMouseDown: function (x, y) {
        if (!this.scene.pointed_object) {
            this.scene.drag_line_points.push({x: x, y: y, idx: this.scene.drag_line_points.length});
            return true;
        }
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        return false;
    },

    onMouseDownObject: function (obj) {
        return false;
    },

    onMouseUpObject: function (obj) {
        return true;
    },

    onKeyDown: function (event) {
        if (event.which == KeyCode.Escape) {
            this.scene.resetEdgeMode();
            return true;
        }
        return false;
    },

    onKeyUp: function (event) {
        return false;
    },

    finishCreation: function () {
        this.scene.commandManager.execute(new SCgCommandCreateContour(this.scene));
    }

};
