ImageComponent = {
    formats: ['format_png', 'format_jpg', 'format_gif'],
    factory: function(sandbox) {
        return new ImageViewer(sandbox);
    }
};

var ImageViewer = function(sandbox){
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;

    // ---- window interface -----
    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();

        $(this.container).empty();
        $(this.container).append('<img src="' + data + '" style="width: 100%; height: 100%;"></img>');

        dfd.resolve();
        return dfd.promise();
    };
    
    if (this.sandbox.addr) {
        this.receiveData('api/link/content/?addr=' + this.sandbox.addr);
    }
};


SCWeb.core.ComponentManager.appendComponentInitialize(ImageComponent);
