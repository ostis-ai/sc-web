SCWeb.core.ui.OutputLanguages = (function() {

    var _menuId = 'select_output_language';
    var _menuSelector = '#' + _menuId;
    var _languages = [];
    var _translLanguages = [];
    var _updateLanguages = function(eventData) {

        var languages = eventData.outputLanguages;
        _translLanguages = [];
        for ( var i = 0; i < languages.length; i++) {
            _translLanguages.push(languages[i]);
        }
    };

    var _appendLanguageToControl = function(language) {

        $(_menuSelector).append(
                '<option value="' + language + '"' + 'id="output_lang_'
                        + language + '" sc_addr="' + language + '">' + language
                        + '</option>');
    };

    return {
        init : function() {

            SCWeb.core.Environment.on(SCWeb.core.events.Translation.UPDATE, $
                    .proxy(this.updateTranslation, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Translation.COLLECT_ADDRS, $.proxy(
                            this.getObjectsToTranslate, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Component.REGISTERED, $
                    .proxy(this.componentRegistered, this));
            SCWeb.core.Environment.registerResource(
                    SCWeb.core.Resources.OUTPUT_LANGUAGE, $.proxy(
                            this.getLanguage, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Core.START, $.proxy(
                    _updateLanguages, this));
        },

        getLanguage : function() {

            return $(_menuSelector + ' :selected').val();
        },

        // ---------- Translation listener interface ------------
        updateTranslation : function(namesMap) {

            // apply translation
            $('#select_output_language [sc_addr]').each(
                    function(index, element) {

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

            toTranslate.append(_translLanguages);
        },

        // ----------- Component listener ----------------
        componentRegistered : function(compDescr) {

            var sc_addr = compDescr.outputLangAddr;
            if (sc_addr && _translLanguages.indexOf(sc_addr) >= 0) {
                _appendLanguageToControl(sc_addr);
                _languages.push(sc_addr);
            }
        }
    };
})();
