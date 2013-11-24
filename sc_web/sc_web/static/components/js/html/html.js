HtmlComponent = {
    formats: ['format_html'],
    factory: function(sandbox) {
        return new HtmlViewer(sandbox);
    }
};

var HtmlViewer = function(sandbox){
    this._initWindow(sandbox);
};

HtmlViewer.prototype = {
    
    _container: null,
    
    _initWindow: function(sandbox) {
        this._container = '#' + sandbox.container;
        this.sandbox = sandbox;
        
        if (this.sandbox.link_addr) {            
            this.sandbox.getLinkContent(this.sandbox.link_addr, 
                                            $.proxy(this.receiveData, this),
                                            function () {});
        }
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        $(this._container).empty();
        $(this._container).append( data );
    },
    
};

SCWeb.core.ComponentManager.appendComponentInitialize(HtmlComponent);
