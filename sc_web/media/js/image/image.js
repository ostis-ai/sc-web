ImageComponent = {
    type: 0,
    outputLang: null,
    formats: ['hypermedia_format_png', 'hypermedia_format_jpg'],
    factory: function(config) {
        return new ImageViewer(config);
    }
};

var ImageViewer = function(config){
    this._initWindow(config);
    return this;
};

ImageViewer.prototype = {
    
    _container: null,
    _config: null,
    
    _initWindow: function(config) {
        this._container = '#' + config['container'];
        this._config = config;
        
        if (this._config.dataAddr) {
            this.receiveData(SCWeb.core.Server._buildLinkContentUrl(this._config.dataAddr));
        }
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        $(this._container).empty();
        $(this._container).append('<img src="' + data + '"></img>');
    },
    
    translateIdentifiers: function(language) {
    },
    
    getIdentifiersLanguage: function() {
        return [];
    },
    
    destroy: function() {
    }
};

$(document).ready(function() {
    SCWeb.core.ComponentManager.appendComponentInitialize(function() {
        SCWeb.core.ComponentManager.registerComponent(ImageComponent);
    });
});
