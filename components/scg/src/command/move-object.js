SCgCommandMoveObject = function (object, oldPosition, newPosition) {
    this.object = object;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
};

SCgCommandMoveObject.prototype = {

    constructor: SCgCommandMoveObject,

    undo: function() {
        this.object.setPosition(this.oldPosition);
    },

    execute: function() {
        this.object.setPosition(this.newPosition);
    }

};
