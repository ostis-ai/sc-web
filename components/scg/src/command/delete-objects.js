SCgCommandDeleteObjects = function (objects, scene) {
    this.objects = objects;
    this.scene = scene;
};

SCgCommandDeleteObjects.prototype = {

    constructor: SCgCommandDeleteObjects,

    undo: function () {
        for (let numberObject = 0; numberObject < this.objects.length; numberObject++) {
            this.scene.appendObject(this.objects[numberObject]);
            if (this.objects[numberObject].sc_addr)
                this.scene.objects[this.objects[numberObject].sc_addr] = this.objects[numberObject];
            this.objects[numberObject].update();
        }
    },

    execute: function () {
        for (let numberObject = 0; numberObject < this.objects.length; numberObject++) {
            const object = this.objects[numberObject];
            this.scene.removeObject(object);
            if (object.sc_addr) delete this.scene.objects[object.sc_addr];
        }
    }
};
