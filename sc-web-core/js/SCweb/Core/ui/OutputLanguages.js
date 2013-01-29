SCWeb.core.ui.OutputLanguages = {
    _menuId: 'select_output_language',
    _languages: null,

    init: function(callback) {
        this.update(callback);
        SCWeb.core.Translation.registerListener(this);
        SCWeb.core.ComponentManager.setListener(this);
    },

    update: function(callback) {
        var me = this;
        SCWeb.core.Server.getOutputLanguages(function(languages) {
            me._updateLanguages(languages);
            if(callback) {
                callback();
            }
        });
    },

    getLanguage: function() {
        return $('#' + this._menuId + ' :selected').val();
    },

    /**
     * Appends language into selection control
     */
    _appendLanguageToControl: function(language) {
        
        
        $('#' + this._menuId).append(
            '<option value="' + language + '"' + 'id="output_lang_' + language + '" sc_addr="' + language + '">' + language + '</option>'
        );
    },

    _updateLanguages: function(languages) {
        this._languages = [];

        var language;
        for(var i = 0; i < languages.length; i++) {
            
            language = languages[i];
            this._languages.push(language);
            // do not appen languages, that haven't viewers
            if (!SCWeb.core.ComponentManager.checkViewer(language))
                continue;
            
            this._appendLanguageToControl(language);
        }

    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#select_output_language [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    },
    
    /**
     * @return Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate: function() {
        return this._languages;
    },
    
    // ----------- Component listener ----------------
    componentRegistered: function(compDescr) {
        var sc_addr = compDescr.outputLangAddr;
        if (sc_addr) {
            this._appendLanguageToControl(sc_addr);
        }
    },
    
    componentUnregistered: function(compDescr) {
        
    }
};
