SCgCommandChangeIdtf = function (object, newIdtf) {
    this.object = object;
    this.oldIdtf = object.text;
    this.newIdtf = newIdtf;
};

SCgCommandChangeIdtf.prototype = {

    constructor: SCgCommandChangeIdtf,

    undo: function () {
        this.object.setText(this.oldIdtf);
    },

    execute: function () {
        this.object.setText(this.newIdtf);
    }

};
