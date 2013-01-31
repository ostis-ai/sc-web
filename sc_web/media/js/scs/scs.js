SCsComponent = {
    type: 0,
    outputLang: 'format_scs_json',
    factory: function(config) {
        return new SCsViewer(config);
    }
};

var SCsViewer = function(config){
    this._initWindow(config);
    return this;
};

SCsViewer.prototype = {
    
    _container: null,
    
    _initWindow: function(config) {
        this._container = '#' + config['container'];
    },
    
    
    // ---- window interface -----
    recieveData: function(data) {
        var outputHtml = ''
        for (var i = 0; i < data.length; i++) {
            var sentence = data[i];
            
            outputHtml += sentence['1'] + ' ' + sentence['2'] + ' ' + sentence['3'] + ';;</br>';
        }
        
        $(this._container).append(outputHtml);
    }
};

$(document).ready(function() {
    SCWeb.core.ComponentManager.appendComponentInitialize(function() {
        SCWeb.core.ComponentManager.registerComponent(SCsComponent);
    });
});
