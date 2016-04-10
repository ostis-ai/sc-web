SCgCommandChangeIdtf = function (object, oldIdtf, newIdtf) {
    this.object = object;
    this.oldIdtf = oldIdtf;
    this.newIdtf = newIdtf;
};

SCgCommandChangeIdtf.prototype = {

    constructor: SCgCommandChangeIdtf,

    undo: function() {
        this.object.setText(this.oldIdtf);
    },

    execute: function() {
        this.object.setText(this.newIdtf);
    }

};
