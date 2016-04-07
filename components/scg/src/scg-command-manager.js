SCgCommandManager = function (scene) {
    this.scene = scene;
    this.listCommand = [];
    this.indexCommand = -1;
};

SCgCommandManager.prototype = {

    constructor: SCgCommandManager,

    addCommand: function(command) {
        this.destroyObject();
        this.listCommand = this.listCommand.slice(0, this.indexCommand + 1);
        this.listCommand.push(command);
        this.indexCommand++;
        console.log("Add");
        console.log(this.listCommand.length);
    },

    clear: function() {
        this.listCommand = [];
        this.indexCommand = -1;
        console.log("Clear");
    },

    destroyObject: function () {
        for (var numberObject = this.indexCommand + 1; numberObject < this.listCommand.length; numberObject++){
            this.listCommand[numberObject] = null;
        }
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

SCgCommandCreateEdge = function (edge) {
    this.edge = edge;
};

SCgCommandCreateEdge.prototype = {

    constructor: SCgCommandCreateEdge,

    undo: function(commandManager) {
        commandManager.scene.removeObject(this.edge);
        return true;
    },

    redo: function(commandManager) {
        commandManager.scene.appendEdge(this.edge);
        this.edge.update();
        return true;
    }

};

SCgCommandCreateBus = function (bus) {
    this.bus = bus;
};

SCgCommandCreateBus.prototype = {

    constructor: SCgCommandCreateBus,

    undo: function(commandManager) {
        commandManager.scene.removeObject(this.bus);
        return true;
    },

    redo: function(commandManager) {
        commandManager.scene.appendBus(this.bus);
        this.bus.update();
        return true;
    }

};

SCgCommandCreateContour = function (contour) {
    this.contour = contour;
};

SCgCommandCreateContour.prototype = {

    constructor: SCgCommandCreateContour,

    undo: function(commandManager) {
        commandManager.scene.removeObject(this.contour);
        return true;
    },

    redo: function(commandManager) {
        commandManager.scene.appendContour(this.contour);
        this.contour.update();
        return true;
    }

};

SCgCommandCreateLink = function (link) {
    this.link = link;
};

SCgCommandCreateLink.prototype = {

    constructor: SCgCommandCreateLink,

    undo: function(commandManager) {
        commandManager.scene.removeObject(this.link);
        return true;
    },

    redo: function(commandManager) {
        commandManager.scene.appendLink(this.link);
        this.link.update();
        return true;
    }

};

SCgCommandChangeIdtf = function (object, oldIdtf, newIdtf) {
    this.object = object;
    this.oldIdtf = oldIdtf;
    this.newIdtf = newIdtf;
};

SCgCommandChangeIdtf.prototype = {

    constructor: SCgCommandChangeIdtf,

    undo: function(commandManager) {
        this.object.setText(this.oldIdtf);
        return true;
    },

    redo: function(commandManager) {
        this.object.setText(this.newIdtf);
        return true;
    }

};

SCgCommandChangeContent = function (object, oldContent, newContent) {
    this.object = object;
    this.oldContent = oldContent;
    this.newContent = newContent;
};

SCgCommandChangeContent.prototype = {

    constructor: SCgCommandChangeContent,

    undo: function(commandManager) {
        this.object.setContent(this.oldContent);
        return true;
    },

    redo: function(commandManager) {
        this.object.setContent(this.newContent);
        return true;
    }

};

SCgCommandChangeType = function (object, oldType, newType) {
    this.object = object;
    this.oldType = oldType;
    this.newType = newType;
};

SCgCommandChangeType.prototype = {

    constructor: SCgCommandChangeType,

    undo: function(commandManager) {
        this.object.setScType(this.oldType);
        return true;
    },

    redo: function(commandManager) {
        this.object.setScType(this.newType);
        return true;
    }

};

SCgCommandMoveObject = function (object, oldPosition, newPosition) {
    this.object = object;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
};

SCgCommandMoveObject.prototype = {

    constructor: SCgCommandMoveObject,

    undo: function(commandManager) {
        this.object.setPosition(this.oldPosition);
        return true;
    },

    redo: function(commandManager) {
        this.object.setPosition(this.newPosition);
        return true;
    }

};

