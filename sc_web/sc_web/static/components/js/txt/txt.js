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
		this.sandbox.getLinkContent(this.sandbox.link_addr,
			function(data) {
				self.sandbox.onDataAppend(data)
			},
			function(jqXHR, textStatus, errorThrown) {
				self.receiveData('<span style="color: red;">error</span>');
			} // error
		);
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        $(this.container).empty();
        $(this.container).text( data );
    },
    
};

SCWeb.core.ComponentManager.appendComponentInitialize(TextComponent);
