ImageComponent = {
    formats: ['format_png', 'format_jpg', 'format_gif'],
    factory: function(sandbox) {
        return new ImageViewer(sandbox);
    }
};

var ImageViewer = function(sandbox){
    this._initWindow(sandbox);
};

ImageViewer.prototype = {
    
    
    _initWindow: function(sandbox) {
        this.container = '#' + sandbox.container;
        this.sandbox = sandbox;
        
        if (this.sandbox.link_addr) {
            this.receiveData('api/link/content/?addr=' + this.sandbox.link_addr);
        }
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        var dfd = new jQuery.Deferred();

        $(this.container).empty();
        $(this.container).append('<img src="' + data + '" style="width: 100%; height: 100%;"></img>');

        dfd.resolve();
        return dfd.promise();
    },

};

SCWeb.core.ComponentManager.appendComponentInitialize(ImageComponent);
