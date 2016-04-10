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
