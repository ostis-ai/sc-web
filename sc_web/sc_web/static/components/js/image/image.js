ImageComponent = {
    formats: ['hypermedia_format_png', 'hypermedia_format_jpg'],
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
        $(this.container).empty();
        $(this.container).append('<img src="' + data + '"></img>');
    },

};

SCWeb.core.ComponentManager.appendComponentInitialize(ImageComponent);
