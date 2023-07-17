TextComponent = {
    formats: ['format_txt'],
    factory: function(sandbox) {
        return new TextViewer(sandbox);
    }
};

const TextViewer = function(sandbox){
    this.sandbox = sandbox;
    this.container = '#' + sandbox.container;
    
    // ---- window interface -----
    this.receiveData = (data) => {
        const container = $(this.container);
        container.empty();
        container.addClass('sc-content-string');
        container.text(data);

        SCWeb.core.EventManager.emit("render/update");
    };

    if (sandbox.content) {
        this.receiveData(sandbox.content);
    } else {
        this.sandbox.eventDataAppend = this.receiveData;
        this.sandbox.updateContent();
    }
};



SCWeb.core.ComponentManager.appendComponentInitialize(TextComponent);
