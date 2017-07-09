SCgSelectListener = function (scene) {
    this.scene = scene;
    this.position = null;
    this.offsetObject = null;
};

SCgSelectListener.prototype = {

    constructor: SCgSelectListener,

    selectObject: function (obj) {
        if (!d3.event.ctrlKey) this.scene.clearSelection();
        this.scene.appendSelection(obj);
        this.scene.updateObjectsVisual();
    },

    onMouseMove: function (x, y) {
        var self = this;
        var offset = new SCg.Vector3(x - this.scene.mouse_pos.x, y - this.scene.mouse_pos.y, 0);
        this.scene.mouse_pos.x = x;
        this.scene.mouse_pos.y = y;
        if (this.scene.focused_object) {
            this.scene.selected_objects.forEach(function (object) {
                if (!(object.contour != null && self.scene.selected_objects.indexOf(object.contour) > -1)) {
                    object.setPosition(object.position.clone().add(offset));
                }
            });
            this.scene.updateObjectsVisual();
            return true;
        }
        return false;
    },

    onMouseDown: function (x, y) {
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        if (this.scene.pointed_object && !(this.scene.pointed_object instanceof SCg.ModelContour)) {
            return false;
        }
        this.scene.commandManager.execute(new SCgCommandCreateNode(x, y, this.scene));
        return true;
    },

    onMouseDownObject: function (obj) {
        this.offsetObject = obj;
        this.scene.focused_object = obj;
        this.position = this.scene.focused_object.position.clone();
        if (obj instanceof SCg.ModelContour || obj instanceof SCg.ModelBus) {
            obj.previousPoint = new SCg.Vector2(this.scene.mouse_pos.x, this.scene.mouse_pos.y);
        }
        if (d3.event.ctrlKey) {
            this.selectObject(obj);
            this.onMouseUpObject(obj); // do not move object after select with ctrl
        } else {
            if (this.scene.selected_objects.indexOf(obj) == -1) {
                this.selectObject(obj);
            }
        }
        return false;
    },

    onMouseUpObject: function (obj) {
        if (!this.scene.focused_object) return; // do nothing after select with ctrl
        var offset = new SCg.Vector3(this.position.x - this.scene.mouse_pos.x, this.position.y - this.scene.mouse_pos.y, 0);
        if (!this.position.equals(this.scene.focused_object.position) && this.offsetObject == obj) {
            var commands = [];
            var self = this;
            this.scene.selected_objects.forEach(function (object) {
                if (!(object.contour != null && self.scene.selected_objects.indexOf(object.contour) > -1)) {
                    commands.push(new SCgCommandMoveObject(object, offset));
                }
            });
            this.scene.commandManager.execute(new SCgWrapperCommand(commands), true);
            this.offsetObject = null;
            this.position = null;
        } else if (!d3.event.ctrlKey && obj == this.scene.focused_object) {
            this.selectObject(obj); // remove multi selection and select object
        }
        this.scene.focused_object = null;
        return true;
    },

    onKeyDown: function (event) {
        return false;
    },

    onKeyUp: function (event) {
        return false;
    }

};
