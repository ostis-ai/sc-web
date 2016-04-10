SCgCommandChangeType = function (object, oldType, newType) {
    this.object = object;
    this.oldType = oldType;
    this.newType = newType;
};

SCgCommandChangeType.prototype = {

    constructor: SCgCommandChangeType,

    undo: function() {
        this.object.setScType(this.oldType);
    },

    execute: function() {
        this.object.setScType(this.newType);
    }

};
