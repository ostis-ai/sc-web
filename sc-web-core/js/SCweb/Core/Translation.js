SCWeb.core.Translation = (function() {

    var _currentLanguage = null;
    var _cacheMap = {};

    var _getUncachedNames = function(language, addresses) {

        if (!_cacheMap[language]) {
            // nothing is cached for this language yet
            return addresses;
        } else {
            var uncachedAddressed = [];
            var scAddress;
            var i;
            for (i = 0; i < addresses.length; i++) {
                scAddress = addresses[i];
                // if not in cache for the specified language
                if (!_cacheMap[language][scAddress]) {
                    uncachedAddressed.push(scAddress);
                }
            }
            return uncachedAddressed;
        }
    };

    var _cacheNames = function(language, namesMap) {

        if (!_cacheMap[language]) {
            _cacheMap[language] = {};
        }

        var name;
        var scAddress;
        for (scAddress in namesMap) {
            if (namesMap.hasOwnProperty(scAddress)) {
                name = namesMap[scAddress];
                _cacheMap[language][scAddress] = name;
            }
        }

    };

    var _getRequiredNamesMap = function(language, addresses) {

        var names = {};
        var scAddress;
        var i;
        for (i = 0; i < addresses.length; i++) {
            scAddress = addresses[i];
            names[scAddress] = _cacheMap[language][scAddress];
        }
        return names;
    };

    var _buildTranslateEventData = function(lang, translAddrs) {

        var data = {};
        data.language = lang;
        data.translValues = translAddrs;
        data.callback = function(namesMap) {

            SCWeb.core.Environment.fire(SCWeb.core.events.Translation.UPDATE,
                    namesMap);
        };
        return data;
    };

    var _buildCollectDataEvent = function() {

        var toTranslate = {};
        toTranslate.scAddrs = [];
        toTranslate.append = function(toInsert) {

            var notDuplicated = [];
            for ( var elInd = 0; elInd < toInsert.length; elInd++) {
                if ($.inArray(toInsert[elInd], this.scAddrs) == -1) {
                    notDuplicated.push(toInsert[elInd]);
                }
            }
            this.scAddrs = this.scAddrs.concat(notDuplicated);
        };
        return toTranslate;
    };

    return {
        init : function() {

            SCWeb.core.Environment.on(
                    SCWeb.core.events.Translation.CHANGE_LANG, $.proxy(
                            this.languageChanged, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Translation.TRANSLATE,
                    $.proxy(this.translate, this));
        },
        /**
         * @param {String}
         *            sc-addr of new identifiers language
         */
        languageChanged : function(language) {

            _currentLanguage = language;

            // collect objects, that need to be translated
            var toTranslate = _buildCollectDataEvent();
            SCWeb.core.Environment.fire(
                    SCWeb.core.events.Translation.COLLECT_ADDRS, toTranslate);
            var eventData = _buildTranslateEventData(language,
                    toTranslate.scAddrs);
            this.translate(eventData);

        },

        /**
         * @param {Object}
         *            represent all data which is needed for event. It contains
         *            the following fields:<br>
         *            translValues - objects List of sc-addrs, that need to be
         *            translated<br>
         *            language - {String}. If It value is null, then current
         *            language is used <br>
         *            callback - {Function}.d Callback key is sc-addr of element
         *            and value is identifier. If there are no key in returned
         *            object, then identifier wasn't found
         */
        translate : function(eventData) {

            var lang = eventData.language || _currentLanguage;
            var translValues = eventData.translValues;
            var requiredNamesMap;
            var unachedAddresses = _getUncachedNames(lang, translValues);
            if (unachedAddresses.length === 0) {
                requiredNamesMap = _getRequiredNamesMap(lang, translValues);
                eventData.callback(requiredNamesMap);
            } else {
                var self = this;
                SCWeb.core.Server.resolveIdentifiers(unachedAddresses, lang,
                        function(namesMap) {

                            _cacheNames(lang, namesMap);
                            requiredNamesMap = _getRequiredNamesMap(lang,
                                    translValues);
                            eventData.callback(requiredNamesMap);
                        });
            }
        }
    };
})();
