SCWeb.core.ui.IdentifiersLanguages = {
    _menuId: 'select_idtf_language',
    _languages: null,

    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        this.update(callback);
    },

    update: function(callback) {
        var me = this;
        SCWeb.core.Server.getIdentifierLanguages(function(languages) {
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
            dropdownHtml += '<option value="' + language + '"' + 'id="idtf_lang_' + language + '" sc_addr="' + language + '">' + language + '</option>';
            this._languages.push(language);
        }

        $('#' + this._menuId).append(dropdownHtml);

        SCWeb.core.Translation.languageChanged(this.getLanguage());        

        this._registerMenuHandler();

    },

    _registerMenuHandler: function() {
        var me = this;
        $('#' + this._menuId).change(function() {
                var language = me.getLanguage();
                SCWeb.core.Translation.languageChanged(language);
            });
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#' + this._menuId + ' [sc_addr]').each(function(index, element) {
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
