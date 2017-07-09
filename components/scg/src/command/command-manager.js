SCgCommandManager = function () {
    this.listCommand = [];
    this.indexCommand = -1;
};

SCgCommandManager.prototype = {

    constructor: SCgCommandManager,

    execute: function (command, noNeedExecute) {
        this.destroyObject();
        this.listCommand = this.listCommand.slice(0, this.indexCommand + 1);
        this.listCommand.push(command);
        if (!noNeedExecute) command.execute();
        this.indexCommand++;
    },

    clear: function () {
        this.listCommand = [];
        this.indexCommand = -1;
    },

    destroyObject: function () {
        for (var numberObject = this.indexCommand + 1; numberObject < this.listCommand.length; numberObject++) {
            // TODO obj.destroy();
            delete this.listCommand[numberObject];
        }
    },

    undo: function () {
        if (this.indexCommand > -1) {
            this.listCommand[this.indexCommand].undo(this);
            this.indexCommand--;
        }
    },

    redo: function () {
        if (this.indexCommand < this.listCommand.length - 1) {
            this.indexCommand++;
            this.listCommand[this.indexCommand].execute();
        }
    }

};
