GoogleMapLinkComponent = {
    formats: ['format_googlemaplink'],
    factory: function(sandbox) {
        return new GoogleMapLinkViewer(sandbox);
    }
};

var GoogleMapLinkViewer = function(sandbox){
    this._initWindow(sandbox);
};

GoogleMapLinkViewer.prototype = {
    
    _container: null,
    
    _initWindow: function(sandbox) {
        this._container = '#' + sandbox.container;
        this.sandbox = sandbox;
        
        if (this.sandbox.addr) {           
            this.sandbox.getLinkContent(this.sandbox.addr, 
                                            $.proxy(this.receiveData, this),
                                            function () {});
        }
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        $(this._container).empty();
        $(this._container).append('<iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'
                                  + data + '" style="color:#0000FF;text-align:left">View Larger Map</a></small></iframe>');
    },
};

SCWeb.core.ComponentManager.appendComponentInitialize(GoogleMapLinkComponent);
