SCgCommandDeleteObjects = function (objects, scene) {
    this.objects = objects;
    this.scene = scene;
};

SCgCommandDeleteObjects.prototype = {

    constructor: SCgCommandDeleteObjects,

    undo: function () {
        for (var numberObject = 0; numberObject < this.objects.length; numberObject++) {
            this.scene.appendObject(this.objects[numberObject]);
            if (this.objects[numberObject].sc_addr)
                this.scene.objects[this.objects[numberObject].sc_addr] = this.objects[numberObject];
            this.objects[numberObject].update();
        }
    },

    execute: function () {
        for (var numberObject = 0; numberObject < this.objects.length; numberObject++) {
            this.scene.removeObject(this.objects[numberObject]);
            if (this.objects[numberObject].sc_addr)
                delete this.scene.objects[this.objects[numberObject].sc_addr];
        }
    }

};
