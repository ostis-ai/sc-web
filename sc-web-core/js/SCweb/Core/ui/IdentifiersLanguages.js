SCWeb.core.ui.IdentifiersLanguages = {
    _menuId: 'select_idtf_language',
    _languages: null,

    init: function(callback) {
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
            dropdownHtml += '<option value="' + language + '"' + 'id="idtf_lang_' + language + '" data-sc-addr="' + language + '">' + language + '</option>';
            this._languages.push(language);
        }

        $('#' + this._menuId).append(dropdownHtml);

        SCWeb.core.Translation.addIdentifiers(this._languages);
        SCWeb.core.Translation.addContainer(this._menuId);

        this._registerMenuHandler();

    },

    _registerMenuHandler: function() {
        var me = this;
        $('#' + this._menuId).change(function() {
                var language = me.getLanguage();
                SCWeb.core.Translation.translate(language);
            });
    }
};
