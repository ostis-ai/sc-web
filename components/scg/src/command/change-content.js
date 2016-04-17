SCgCommandChangeContent = function (object, oldContent, newContent, oldType, newType) {
    this.object = object;
    this.oldContent = oldContent;
    this.newContent = newContent;
    this.oldType = oldType;
    this.newType = newType;
};

SCgCommandChangeContent.prototype = {

    constructor: SCgCommandChangeContent,

    undo: function() {
        this.object.setContent(this.oldContent, this.oldType);
    },

    execute: function() {
        this.object.setContent(this.newContent, this.newType);
    }

};
