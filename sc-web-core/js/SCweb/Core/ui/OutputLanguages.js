SCWeb.core.ui.OutputLanguages = {
    _menuId: 'select_output_language',
    _languages: null,

    init: function(callback) {
        this.update(callback);
        SCWeb.core.Translation.registerListener(this);
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

    _updateLanguages: function(languages) {
        this._languages = [];

        var dropdownHtml = '';

        var i;
        var language;
        for(i = 0; i < languages.length; i++) {
            language = languages[i];
            dropdownHtml += '<option value="' + language + '"' + 'id="output_lang_' + language + '" sc_addr="' + language + '">' + language + '</option>';
            this._languages.push(language);
        }

        $('#' + this._menuId).append(dropdownHtml);

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
    }
};
