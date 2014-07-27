TextComponent = {
    formats: ['format_txt'],
    factory: function(sandbox) {
        return new TextViewer(sandbox);
    }
};

var TextViewer = function(sandbox){

    this.sandbox = sandbox;
    this.container = '#' + sandbox.container;
    
    // ---- window interface -----
    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();
        
        $(this.container).empty();
        $(this.container).text( data );
        dfd.resolve();

        return dfd.promise();
    },

    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.updateContent();
};



SCWeb.core.ComponentManager.appendComponentInitialize(TextComponent);
