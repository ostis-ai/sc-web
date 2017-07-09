/**
 * This object conrols available modes for natural languages (russina, english ant etc.)
 * It can fires next events:
 * - "translation/update" - this event emits on mode changed. Parameter: dictionary, that contains new translation
 * - "translation/get" - this event emits to collect all objects for translate. Parameter: array, that need to be filled by listener
 * - "translation/changed_language" - this event emits, when current language changed. Parameter: sc-addr of current language
 * - "translation/change_language_start" - this event emits on language change start. Parameter: empty
 * (this array couldn't be cleared, listener just append new elements).
 */
SCWeb.core.Translation = {

    listeners: [],
    current_lang: null,

    /** Updates all translations
     */
    update: function () {
        var dfd = new jQuery.Deferred();

        // collect objects, that need to be translated
        var objects = this.collectObjects();

        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        $.when(this.translate(objects)).then(
            function (namesMap) {
                self.fireUpdate(namesMap);
                dfd.resolve();
            },
            function () {
                dfd.reject();
            });

        return dfd.promise();
    },

    getCurrentLanguage: function () {
        return this.current_lang;
    },

    /**
     * Do translation routines. Just for internal usage.
     * @param {Array} objects List of sc-addrs, that need to be translated
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function (objects) {
        var dfd = new jQuery.Deferred();

        var self = this;
        SCWeb.core.Server.resolveIdentifiers(objects, function (namesMap) {
            dfd.resolve(namesMap);
        });

        return dfd.promise();
    },

    /** Change translation language
     * @param {String} lang_addr sc-addr of language to translate
     * @param {Function} callback Callbcak function that will be called on language change finish
     */
    setLanguage: function (lang_addr, callback) {
        var self = this;
        SCWeb.core.Server.setLanguage(lang_addr, function () {
            self.fireLanguageChanged(lang_addr);
            $.when(self.translate(self.collectObjects())).done(function (namesMap) {
                self.fireUpdate(namesMap);
                callback();
            });
        });
    },

    /** Fires translation update event
     * @param {Dict} namesMap Dictionary that contains translations
     */
    fireUpdate: function (namesMap) {
        // notify listeners for new translations
        SCWeb.core.EventManager.emit("translation/update", namesMap);
    },

    fireLanguageChanged: function (lang_addr) {
        SCWeb.core.EventManager.emit("translation/changed_language", lang_addr);
        this.current_lang = lang_addr;
    },

    /** Collect objects for translation
     */
    collectObjects: function () {
        var objects = [];
        SCWeb.core.EventManager.emit("translation/get", objects);
        return objects;
    },

    /** Request to translate objects
     * @param {Array} objects Array of objects to translate
     */
    requestTranslate: function (objects) {
        var self = this;
        this.translate(objects, function (namesMap) {
            self.fireUpdate(namesMap);
        });
    }

};
