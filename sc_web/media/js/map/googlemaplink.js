GoogleMapLinkComponent = {
    type: 0,
    outputLang: null,
    formats: ['hypermedia_format_googlemaplink'],
    factory: function(config) {
        return new GoogleMapLinkViewer(config);
    }
};

var GoogleMapLinkViewer = function(config){
    this._initWindow(config);
    return this;
};

GoogleMapLinkViewer.prototype = {
    
    _container: null,
    _config: null,
    
    _initWindow: function(config) {
        this._container = '#' + config['container'];
        this._config = config;
        
        if (this._config.dataAddr) {
            /*$.ajax({
                url: SCWeb.core.Server._buildLinkContentUrl(this._config.dataAddr),
                success: $.proxy(this.receiveData, this),
                dataType: "text"
            });*/
            
            SCWeb.core.Server.getLinkContent(this._config.dataAddr, 
                                            $.proxy(this.receiveData, this),
                                            function () {});
        }
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        $(this._container).empty();
        $(this._container).append('<iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'
                                  + data + '" style="color:#0000FF;text-align:left">View Larger Map</a></small>');
    },
    
    translateIdentifiers: function(language) {
    },
    
    getIdentifiersLanguage: function() {
        return [];
    },
    
    destroy: function() {
    }
};

SCWeb.core.ComponentManager.appendComponentInitialize(function() {
    SCWeb.core.ComponentManager.registerComponent(GoogleMapLinkComponent);
});
