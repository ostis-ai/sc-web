SCgCommandGetNodeFromMemory = function (object, oldType, newType, oldIdtf, newIdtf, oldScAddr, newScAddr, scene) {
    this.object = object;
    this.oldType = oldType;
    this.newType = newType;
    this.oldIdtf = oldIdtf;
    this.newIdtf = newIdtf;
    this.oldScAddr = oldScAddr;
    this.newScAddr = newScAddr;
    this.scene = scene;
};

SCgCommandGetNodeFromMemory.prototype = {

    constructor: SCgCommandGetNodeFromMemory,

    undo: function() {
        this.object.setText(this.oldIdtf);
        this.object.setScType(this.oldType);
        if (this.oldScAddr != null){
            this.object.setScAddr(this.oldScAddr, true);
        } else {
            this.object.sc_addr = null;
            this.object.state = SCgObjectState.Normal;
            delete this.scene.objects[this.sc_addr];
        }
    },

    execute: function() {
        this.object.setText(this.newIdtf);
        this.object.setScAddr(this.newScAddr, true);
        this.object.setScType(this.newType);
    }

};
