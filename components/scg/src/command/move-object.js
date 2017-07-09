SCgCommandMoveObject = function (object, offset) {
    this.object = object;
    this.offset = offset;
};

SCgCommandMoveObject.prototype = {

    constructor: SCgCommandMoveObject,

    undo: function () {
        this.object.setPosition(this.object.position.clone().add(this.offset));
    },

    execute: function () {
        this.object.setPosition(this.object.position.clone().sub(this.offset));
    }

};
