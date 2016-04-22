SCgSelectListener = function(scene) {
    this.scene = scene;
    this.selectObject = this.selectSingleObject;
    this.position = null;
    this.offsetObject = null;
};

SCgSelectListener.prototype = {
    
    constructor: SCgSelectListener,

    selectSingleObject: function(obj){
        this.scene.clearSelection();
        this.scene.appendSelection(obj);
        this.scene.updateObjectsVisual();
    },

    selectMultipleObject: function (obj) {
        this.scene.appendSelection(obj);
        this.scene.updateObjectsVisual();
    },

    onMouseMove: function(x, y) {
        var offset = new SCg.Vector3(x - this.scene.mouse_pos.x, y - this.scene.mouse_pos.y, 0);
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        if (this.scene.focused_object) {
            if (this.scene.focused_object.sc_type & (sc_type_node | sc_type_link)) {
                this.scene.focused_object.setPosition(this.scene.focused_object.position.clone().add(offset));
            }
            this.scene.updateObjectsVisual();
            return true;
        }
        return false;
    },

    onMouseDown: function(x, y) {
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        if (this.scene.pointed_object && !(this.scene.pointed_object instanceof SCg.ModelContour)) {
            return false;
        }
        this.scene.commandManager.execute(new SCgCommandCreateNode(x, y, this.scene));
        return true;
    },

    onMouseDownObject: function(obj) {
        this.offsetObject = obj;
        this.scene.focused_object = obj;
        this.position = this.scene.focused_object.position.clone();
        if (obj instanceof SCg.ModelContour || obj instanceof SCg.ModelBus) {
            obj.previousPoint = new SCg.Vector2(this.scene.mouse_pos.x, this.scene.mouse_pos.y);
            return true;
        }
        return false;
    },

    onMouseUpObject: function (obj) {
        var newPosition = this.scene.focused_object.position.clone();
        if (!this.position.equals(newPosition) && this.offsetObject == obj){
            this.scene.commandManager.execute(new SCgCommandMoveObject(obj,
                this.position,
                newPosition));
            this.offsetObject = null;
            this.position = null;
        }
        if (obj == this.scene.focused_object) {
            this.selectObject(obj);
        }
        this.scene.focused_object = null;
        return true;
    },

    onKeyDown: function(event) {
        if(event.ctrlKey){
            this.selectObject = this.selectMultipleObject;
            return true;
        }
        return false;
    },

    onKeyUp: function(event) {
        if(!event.ctrlKey){
            this.selectObject = this.selectSingleObject;
            return true;
        }
        return false;
    }

};
