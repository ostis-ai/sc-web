SCgLinkListener = function(scene) {
    this.scene = scene;
};

SCgLinkListener.prototype = {

    constructor: SCgLinkListener,

    onMouseMove: function(x, y) {
        return false;
    },

    onMouseDown: function(x, y) {
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        if (this.scene.pointed_object) return false;
        this.scene.commandManager.execute(new SCgCommandCreateLink(x, y, this.scene));
        return true;
    },

    onMouseDownObject: function(obj) {
        return false;
    },

    onMouseUpObject: function(obj) {
        return true;
    },

    onKeyDown: function(key_code) {
        return false;
    },

    onKeyUp: function(key_code) {
        return false;
    }

};