SCWeb.core.ui.IdentifiersLanguages = (function() {

    var _menuId = 'select_idtf_language';
    var _menuSelector = '#' + _menuId;
    var _languages = null;

    var _getLanguage = function() {

        return $(_menuSelector + ' :selected').val();
    };

    var _registerMenuHandler = function() {

        $(_menuSelector).change(
                function() {

                    var language = _getLanguage();
                    SCWeb.core.Environment
                            .fire(SCWeb.core.events.Translation.CHANGE_LANG,
                                    language);
                });
    };

    var _updateLanguages = function(eventData) {

        var languages = eventData.identifierLanguages;
        _languages = [];

        var dropdownHtml = '';

        var i;
        var language;
        for (i = 0; i < languages.length; i++) {
            language = languages[i];
            dropdownHtml += '<option value="' + language + '"'
                    + 'id="idtf_lang_' + language + '" sc_addr="' + language
                    + '">' + language + '</option>';
            _languages.push(language);
        }

        $(_menuSelector).append(dropdownHtml);

        SCWeb.core.Environment.fire(SCWeb.core.events.Translation.CHANGE_LANG,
                _getLanguage());

        _registerMenuHandler();

    };

    return {

        init : function(callback) {

            SCWeb.core.Environment.on(SCWeb.core.events.Translation.UPDATE, $
                    .proxy(this.updateTranslation, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Translation.COLLECT_ADDRS, $.proxy(
                            this.getObjectsToTranslate, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Core.START, $.proxy(
                    _updateLanguages, this));
        },

        // ---------- Translation listener interface ------------
        updateTranslation : function(namesMap) {

            // apply translation
            $(_menuSelector + ' [sc_addr]').each(function(index, element) {

                var addr = $(element).attr('sc_addr');
                if (namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                }
            });

        },

        /**
         * @return Returns list obj sc-elements that need to be translated
         */
        getObjectsToTranslate : function(toTranslate) {

            toTranslate.append(_languages);
        }
    };
})();
