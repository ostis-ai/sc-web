SCgCommandMovePoint = function (object, oldPoints, newPoints, scene) {
    this.object = object;
    this.oldPoints = Array.from(oldPoints);
    this.newPoints = Array.from(newPoints);
    this.scene = scene;
};

SCgCommandMovePoint.prototype = {

    constructor: SCgCommandMovePoint,

    undo: function () {
        this.object.points = this.oldPoints;
        if (this.object.is_selected) this.scene.line_points = [];
        this.object.update();
    },

    execute: function () {
        this.object.points = this.newPoints;
        if (this.object.is_selected) this.scene.line_points = [];
        this.object.update();
    }

};
