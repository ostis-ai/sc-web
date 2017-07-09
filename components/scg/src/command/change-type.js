SCgCommandChangeType = function (object, newType) {
    this.object = object;
    this.oldType = object.sc_type;
    this.newType = newType;
};

SCgCommandChangeType.prototype = {

    constructor: SCgCommandChangeType,

    undo: function () {
        this.object.setScType(this.oldType);
    },

    execute: function () {
        this.object.setScType(this.newType);
    }

};
