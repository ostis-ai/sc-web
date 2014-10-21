YoutubeLinkComponent = {
    formats: ['format_youtubelink'],
    factory: function(sandbox) {
        return new YoutubeLinkViewer(sandbox);
    }
};

var YoutubeLinkViewer = function(sandbox){
    this._initWindow(sandbox);
    return this;
};

YoutubeLinkViewer.prototype = {
    
    _container: null,
    
    _initWindow: function(sandbox) {
        this._container = '#' + sandbox.container;
        this.sandbox = sandbox;
        
        if (this.sandbox.addr) {
            SCWeb.core.Server.getLinkContent(this.sandbox.addr, 
                                            $.proxy(this.receiveData, this),
                                            function () {});
        }
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        $(this._container).empty();
        $(this._container).append('<iframe title="YouTube video player" class="youtube-player" type="text/html" width="640" height="390" src="http://www.youtube.com/embed/' 
                                  + data + '?wmode=transparent" frameborder="0" allowFullScreen></iframe>');
    },
   
};

SCWeb.core.ComponentManager.appendComponentInitialize(YoutubeLinkComponent);
