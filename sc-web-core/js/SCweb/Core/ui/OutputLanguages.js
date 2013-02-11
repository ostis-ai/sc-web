SCWeb.core.ui.OutputLanguages = {
    _menuId: 'select_output_language',
    _languages: [],
    _transl_languages: [], // list of output languages that has translation support

    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        SCWeb.core.ComponentManager.setListener(this);
        
        this.update(callback);
    },

    update: function(callback) {
        var self = this;
        SCWeb.core.Server.getOutputLanguages(function(languages) {
            self._updateLanguages(languages);
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

        this._transl_languages = [];
        var language;
        for(var i = 0; i < languages.length; i++) {
            
            language = languages[i];
            this._transl_languages.push(language);
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
        if (sc_addr && this._transl_languages.indexOf(sc_addr) >= 0) {
            this._appendLanguageToControl(sc_addr);
            this._languages.push(sc_addr);
        }
    },
    
    componentUnregistered: function(compDescr) {
        
    }
};
