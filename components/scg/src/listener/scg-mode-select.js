SCgSelectListener = function(scene) {
    this.scene = scene;
};

SCgSelectListener.prototype = {
    
    constructor: SCgSelectListener,

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
        if (this.scene.pointed_object) return false; // do nothing
        this.scene.createNode(SCgTypeNodeNow, new SCg.Vector3(x, y, 0), '');
        this.scene.updateRender();
        return true;
    },

    onMouseDownObject: function(obj) {
        this.scene.focused_object = obj;
        if (obj instanceof SCg.ModelContour || obj instanceof SCg.ModelBus) {
            obj.previousPoint = new SCg.Vector2(this.scene.mouse_pos.x, this.scene.mouse_pos.y);
            return true;
        }
        return false;
    },

    onMouseUpObject: function (obj) {
        // case we moved object from contour
        if (obj.contour && !obj.contour.isNodeInPolygon(obj)) {
            obj.contour.removeChild(obj);
        }
        // case we moved object into the contour
        if (!obj.contour && (obj instanceof SCg.ModelNode || obj instanceof SCg.ModelLink)) {
            for (var i = 0; i < this.scene.contours.length; i++) {
                if (this.scene.contours[i].isNodeInPolygon(obj)) {
                    this.scene.contours[i].addChild(obj);
                }
            }
        }
        if (obj == this.scene.focused_object) {
            this.scene.clearSelection();
            this.scene.appendSelection(obj);
            this.scene.updateObjectsVisual();
        }
        this.scene.focused_object = null;
        return true;
    },

    onKeyDown: function(key_code) {
        return false;
    },

    onKeyUp: function(key_code) {
        return false;
    }

};
