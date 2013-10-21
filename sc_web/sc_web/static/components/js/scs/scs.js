SCsComponent = {
	ext_lang: 'scs_code',
    formats: ['hypermedia_format_scs_json'],
    factory: function(sandbox) {
        return new SCsViewer({container: sandbox.container});
    }
};

var SCsViewer = function(config){
    this._initWindow(config);
    return this;
};

SCsViewer.prototype = {
    
    _container: null,
    _objects: [],
    _addrs: [],
    _sc_links: {}, // map of sc-link objects key:addr, value: object
    _current_language: null,
    _config: null,
    
    _initWindow: function(config) {
        this._container = '#' + config['container'];
        this._config = config;
    },
    
    /**
     * Append new addr into sc-addrs list
     * @param {String} addr sc-addr to append
     */
    _appendAddr: function(addr) {
        if (this._addrs.indexOf(addr) < 0) {
            this._addrs.push(addr);
        }
    },
    
    /**
     * Function to create html representation of one sc-element.
     * Just for internal usage
     * @param {Object} object Object that represents sc-element in json
     * @return Returns string, that contains generated html
     */
    _generateElementHtml: function(object) {
        // check if sc-element is and sc-link
        if (object.type & sc_type_link) {
            this._sc_links[object.addr] = object;
            var containerId = "scs_window_" + this._id.toString() + '_' + object.addr;
            return '<div class="scs_element" id="' + containerId + '">' + '</div>';
        }
        
        return '<div class="scs_element" sc_addr="' + object.addr + '">' + object.addr + '</div>'
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        var outputHtml = ''
        this._objects = [];
        
        
        this._sc_links = {};
        
        for (var i = 0; i < data.length; i++) {
            var sentence = data[i];
            
            outputHtml += '<div class="scs_sentence">' + this._generateElementHtml(sentence[0]) +
                        '<div class="scs_connector scs_element">' + sentence[1] + '</div>' +
                        this._generateElementHtml(sentence[2]) + ';;</div>';
            this._objects.push(sentence[0]);
            this._objects.push(sentence[2]);
            
            this._appendAddr(sentence[0].addr);
            this._appendAddr(sentence[2].addr);
        }
        
        $(this._container).empty();
        $(this._container).append(outputHtml);
        
        var self = this;
        var containers = {};
        // now get sc-links data, and show them
        $.each(this._sc_links, function(addr, obj) {
            var containerId = "scs_window_" + self._id.toString() + '_' + addr;
            containers[addr] = containerId;
            
        });
        
        SCWeb.core.ui.Windows.createViewersForScLinks(containers, 
                function() { // success
                    //$(self._container + ' #' + containerId).text('value');
                },
                function() { // error
                });
    },
    
    translateIdentifiers: function(language) {
        
        var self = this;
        var addrs = [];
        
        SCWeb.core.Translation.translate(this._addrs, language, function(namesMap) {
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
    },
    
    destroy: function() {
    }
};

SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);
