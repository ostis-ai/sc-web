SCgCommandCreateContour = function (scene) {
    this.scene = scene;
    this.contour = null;
};

SCgCommandCreateContour.prototype = {

    constructor: SCgCommandCreateContour,

    undo: function() {
        if (this.contour.is_selected) this.scene.line_points = [];
        this.scene.removeObject(this.contour);
    },

    execute: function() {
        var scene = this.scene;
        if (this.contour == null){
            var polygon = $.map(scene.drag_line_points, function (vertex) {
                return $.extend({}, vertex);
            });
            this.contour = new SCg.ModelContour({ verticies: polygon });
            scene.appendContour(this.contour);
            scene.pointed_object = this.contour;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
        } else {
            scene.appendContour(this.contour);
            this.contour.update();
        }

    }

};