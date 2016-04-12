SCgCommandCreateNode = function (x, y, scene) {
    this.x = x;
    this.y = y;
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
            this.node = SCg.Creator.createNode(SCgTypeNodeNow, new SCg.Vector3(this.x, this.y, 0), '');
            this.scene.appendNode(this.node);
            this.scene.updateRender();
        } else {
            this.scene.appendNode(this.node);
        }
    }

};
