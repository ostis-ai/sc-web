SCgCommandManager = function () {
    this.listCommand = [];
    this.indexCommand = -1;
};

SCgCommandManager.prototype = {

    constructor: SCgCommandManager,

    execute: function(command) {
        this.destroyObject();
        this.listCommand = this.listCommand.slice(0, this.indexCommand + 1);
        this.listCommand.push(command);
        command.execute();
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
            // TODO obj.destroy();
            delete this.listCommand[numberObject];
        }
    },

    undo: function() {
        console.log(this.indexCommand);
        if (this.indexCommand > -1) {
            console.log("Undo " + this.indexCommand);
            this.listCommand[this.indexCommand].undo(this);
            this.indexCommand--;
        }
    },

    redo: function() {
        if (this.indexCommand < this.listCommand.length - 1) {
            this.indexCommand++;
            console.log("Redo " + this.indexCommand);
            this.listCommand[this.indexCommand].execute();
        }
    }

};

SCgCommandCreateNode = function (x, y, type, scene) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.scene = scene;
    this.node = null;
};

SCgCommandCreateNode.prototype = {

    constructor: SCgCommandCreateNode,

    undo: function() {
        this.scene.removeObject(this.node);
    },

    execute: function() {
        if (this.node == null){
            this.node = this.scene.createNode(this.type, new SCg.Vector3(this.x, this.y, 0), '');
            this.scene.updateRender();
        } else {
            this.scene.appendNode(this.node);
        }
    }

};

SCgCommandCreateEdge = function (source, target, type, scene) {
    this.source = source;
    this.target = target;
    this.type = type;
    this.scene = scene;
    this.dragLinePoints = scene.drag_line_points.slice();
    this.edge = null;
};

SCgCommandCreateEdge.prototype = {

    constructor: SCgCommandCreateEdge,

    undo: function() {
        this.scene.removeObject(this.edge);
    },

    execute: function() {
        var scene = this.scene;
        if (this.edge == null){
            this.edge = scene.createEdge(this.source, this.target, this.type);
            var mousePos = new SCg.Vector2(this.target.x, this.target.y);
            var startPos = new SCg.Vector2(this.dragLinePoints[0].x, this.dragLinePoints[0].y);
            this.edge.setSourceDot(this.source.calculateDotPos(startPos));
            this.edge.setTargetDot(this.target.calculateDotPos(mousePos));
            if (this.dragLinePoints.length > 1) this.edge.setPoints(this.dragLinePoints.slice(1));
            scene.edge_data.source = scene.edge_data.target = null;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
            this.edge.need_update = true;
            scene.updateObjectsVisual();
        } else {
            scene.appendEdge(this.edge);
            this.edge.update();
        }
    }

};

SCgCommandCreateBus = function (source, scene) {
    this.source = source;
    this.scene = scene;
    this.dragLinePoints = scene.drag_line_points.slice();
    this.bus = null;
};

SCgCommandCreateBus.prototype = {

    constructor: SCgCommandCreateBus,

    undo: function() {
        this.scene.removeObject(this.bus);
    },

    execute: function() {
        var scene = this.scene;
        if (this.bus == null){
            this.bus = this.scene.createBus(this.source);
            if (this.dragLinePoints.length > 1) this.bus.setPoints(this.dragLinePoints.slice(1));
            var pos = new SCg.Vector2(this.dragLinePoints[0].x, this.dragLinePoints[0].y);
            this.bus.setSourceDot(this.source.calculateDotPos(pos));
            this.bus.setTargetDot(0);
            scene.bus_data.source = scene.bus_data.end = null;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
        } else {
            scene.appendBus(this.bus);
            this.bus.update();
        }

    }

};

SCgCommandCreateContour = function (scene) {
    this.scene = scene;
    this.contour = null;
};

SCgCommandCreateContour.prototype = {

    constructor: SCgCommandCreateContour,

    undo: function() {
        this.scene.removeObject(this.contour);
    },

    execute: function() {
        var scene = this.scene;
        if (this.contour == null){
            var polygon = $.map(scene.drag_line_points, function (vertex) {
                return $.extend({}, vertex);
            });
            this.contour = new SCg.ModelContour({ verticies: polygon });
            scene.appendContour(this.contour);
            scene.pointed_object = this.contour;
            scene.drag_line_points.splice(0, scene.drag_line_points.length);
            scene.updateRender();
            scene.render.updateDragLine();
        } else {
            scene.appendContour(this.contour);
            this.contour.update();
        }

    }

};

SCgCommandCreateLink = function (x, y, scene) {
    this.x = x;
    this.y = y;
    this.scene = scene;
    this.link = null;
};

SCgCommandCreateLink.prototype = {

    constructor: SCgCommandCreateLink,

    undo: function() {
        this.scene.removeObject(this.link);
    },

    execute: function() {
        if (this.link == null){
            this.link = this.scene.createLink(new SCg.Vector3(this.x, this.y, 0), '');
            this.scene.updateRender();
        } else {
            this.scene.appendLink(this.link);
            this.link.update();
        }
    }

};

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

SCgCommandMoveObject = function (object, oldPosition, newPosition) {
    this.object = object;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
};

SCgCommandMoveObject.prototype = {

    constructor: SCgCommandMoveObject,

    undo: function() {
        this.object.setPosition(this.oldPosition);
    },

    execute: function() {
        this.object.setPosition(this.newPosition);
    }

};

SCgCommandDeleteObjects = function (objects, scene) {
    this.objects = objects;
    this.scene = scene;
};

SCgCommandDeleteObjects.prototype = {

    constructor: SCgCommandDeleteObjects,

    undo: function() {
        for (var numberObject = 0; numberObject < this.objects.length; numberObject++){
            this.scene.appendObject(this.objects[numberObject]);
            this.objects[numberObject].update();
        }
        return true;
    },

    execute: function() {
        for (var numberObject = 0; numberObject < this.objects.length; numberObject++){
            this.scene.removeObject(this.objects[numberObject]);
        }
        return true;
    }

};

