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
    _objects: [],
    _current_language: null,
    
    _initWindow: function(config) {
        this._container = '#' + config['container'];
    },
    
    
    // ---- window interface -----
    receiveData: function(data) {
        var outputHtml = ''
        for (var i = 0; i < data.length; i++) {
            var sentence = data[i];
            
            outputHtml += '<div class="scs_sentence"><div class="scs_element" sc_addr="' + sentence[0] + '">' + sentence[0] + '</div>' +
                        '<div class="scs_connector scs_element">' + sentence[1] + '</div>' +
                        '<div class="scs_element" sc_addr="' + sentence[2] + '">' + sentence[2] + '</div>;;</div>';
            this._objects.push(sentence[0]);
            this._objects.push(sentence[2]);
        }
        
        $(this._container).append(outputHtml);
    },
    
    translateIdentifiers: function(language) {
        
        var self = this;
        
        SCWeb.core.Translation.translate(this._objects, language, function(namesMap) {
            // apply translation
            $(self._container + ' [sc_addr]').each(function(index, element) {
                var addr = $(element).attr('sc_addr');
                if(namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                }
            });
        });
    },
    
    getIdentifiersLanguage: function() {
        return this._current_language;
    }
};

$(document).ready(function() {
    SCWeb.core.ComponentManager.appendComponentInitialize(function() {
        SCWeb.core.ComponentManager.registerComponent(SCsComponent);
    });
});
