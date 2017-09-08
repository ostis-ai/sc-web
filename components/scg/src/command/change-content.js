SCgCommandChangeContent = function (object, newContent, newType, newFileReaderResult) {
    this.object = object;
    this.oldContent = object.content;
    this.newContent = newContent;
    this.oldType = object.contentType;
    this.newType = newType;
    this.oldFileReaderResult = object.fileReaderResult;
    this.newFileReaderResult = newFileReaderResult;
};

SCgCommandChangeContent.prototype = {

    constructor: SCgCommandChangeContent,

    undo: function () {
        this.object.setContent(this.oldContent, this.oldType);
        this.object.fileReaderResult = this.oldFileReaderResult;
    },

    execute: function () {
        this.object.setContent(this.newContent, this.newType);
        this.object.fileReaderResult = this.newFileReaderResult;
    }

};
