TextComponent = {
    formats: ['format_txt'],
    factory: function(sandbox) {
        return new TextViewer(sandbox);
    }
};

var TextViewer = function(sandbox){
    this._initWindow(sandbox);
};

TextViewer.prototype = {
    
    _container: null,
    _config: null,
    
    _initWindow: function(sandbox) {
        this.sandbox = sandbox;
        this.container = '#' + sandbox.container;
        
        this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
        
        var self = this;
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        var dfd = new jQuery.Deferred();
        
        $(this.container).empty();
        $(this.container).text( data );
        dfd.resolve();

        return dfd.promise();
    },
    
};

SCWeb.core.ComponentManager.appendComponentInitialize(TextComponent);
