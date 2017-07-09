SCgCommandCreateContour = function (scene) {
    this.scene = scene;
    this.contour = null;
};

SCgCommandCreateContour.prototype = {

    constructor: SCgCommandCreateContour,

    undo: function () {
        if (this.contour.is_selected) {
            var idx = this.scene.selected_objects.indexOf(this.contour);
            this.scene.selected_objects.splice(idx, 1);
            this.contour._setSelected(false);
            this.scene.edit.onSelectionChanged();
            this.scene.line_points = [];
        }
        this.scene.removeObject(this.contour);
    },

    execute: function () {
        var scene = this.scene;
        if (this.contour == null) {
            var polygon = $.map(scene.drag_line_points, function (vertex) {
                return $.extend({}, vertex);
            });
            this.contour = SCg.Creator.createCounter(polygon);
            scene.appendContour(this.contour);
            scene.pointed_object = this.contour;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
            scene.clearSelection();
            scene.appendSelection(this.contour);
        } else {
            scene.appendContour(this.contour);
            this.contour.update();
        }

    }

};