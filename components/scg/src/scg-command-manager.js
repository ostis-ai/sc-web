SCgCommandManager = function (scene) {
    this.scene = scene;
    this.listCommand = [];
    this.indexCommand = -1;
};

SCgCommandManager.prototype = {

    constructor: SCgCommandManager,

    addCommand: function(command) {
        this.listCommand = this.listCommand.slice(0, this.indexCommand + 1);
        this.listCommand.push(command);
        this.indexCommand++;
        console.log("Add");
        console.log(this.listCommand.length);
    },

    clear: function() {
        this.listCommand = [];
        console.log("Clear");
    },

    undo: function() {
        if (this.indexCommand > -1) {
            console.log("Undo");
            var returnValue = this.listCommand[this.indexCommand].undo(this);
            this.indexCommand--;
            this.scene.updateRender();
            return returnValue;
        } else return false;
    },

    redo: function() {
        if (this.indexCommand < this.listCommand.length - 1) {
            console.log("Redo");
            this.indexCommand++;
            var returnValue = this.listCommand[this.indexCommand].redo(this);
            this.scene.updateRender();
            return returnValue;
        } else return false;
    }

};

SCgCommandCreateNode = function (node) {
    this.node = node;
};

SCgCommandCreateNode.prototype = {

    constructor: SCgCommandCreateNode,
    
    undo: function(commandManager) {
        commandManager.scene.removeObject(this.node);
        return true;
    },

    redo: function(commandManager) {
        commandManager.scene.appendNode(this.node);
        return true;
    }

};

