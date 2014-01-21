/**
 * This object conrols available modes for natural languages (russina, english ant etc.)
 * It can fires next events:
 * - "translation/update" - this event emits on mode changed. Parameter: dictionary, that contains new translation
 * - "translation/get" - this event emits to collect all objects for translate. Parameter: array, that need to be filled by listener 
 * (this array couldn't be cleared, listener just append new elements).
 */
SCWeb.core.Translation = {
    
    listeners: [],
       
    /** Updates all translations
     */
    update: function() {
         var dfd = new jQuery.Deferred();

        // collect objects, that need to be translated
        var objects = this.collectObjects();
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        $.when(this.translate(objects)).then(
            function(namesMap) {
                self.fireUpdate(namesMap);
                dfd.resolve();
            },
            function() {
                dfd.reject(); 
            });
        
        return dfd.promise();
     },
      
    /**
     * Do translation routines. Just for internal usage.
     * @param {Array} objects List of sc-addrs, that need to be translated
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function(objects) {
        var dfd = new jQuery.Deferred();

        var self = this;
        SCWeb.core.Server.resolveIdentifiers(objects, function(namesMap) {
            dfd.resolve(namesMap);
        });

        return dfd.promise();
    },
    
    /** Change translation language
     * @param {String} lang_addr sc-addr of language to translate
     * @param {Function} callback Callbcak function that will be called on language change finish
     */
    setLanguage: function(lang_addr, callback) {
        var self = this;
        SCWeb.core.Server.setLanguage(lang_addr, function() { 
            self.translate(self.collectObjects(), function (namesMap) {
                self.fireUpdate(namesMap);
                callback();
            });
        });
    },
    
    /** Fires translation update event
     * @param {Dict} namesMap Dictionary that contains translations
     */
    fireUpdate: function(namesMap) {
        // notify listeners for new translations
        SCWeb.core.EventManager.emit("translation/update", namesMap);
    },
    
    /** Collect objects for translation
     */
    collectObjects: function() {
        var objects = [];
        SCWeb.core.EventManager.emit("translation/get", objects);
        return objects;
    },
    
    /** Request to translate objects
     * @param {Array} objects Array of objects to translate
     */
    requestTranslate: function(objects) {
        var self = this;
        this.translate(objects, function(namesMap) {
            self.fireUpdate(namesMap);
        });
    }
    
};
