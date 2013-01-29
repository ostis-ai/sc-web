SCWeb.core.Translation = {
    
    current_language: null,
    listeners: [],
    
    /** 
     * @param {Object} listener Listener object that will be notified on translation.
     * It must has two functions:
     * - getObjectsToTranslate() - funciton returns array of sc-addrs, that need to be 
     * translated
     * - updateTranslation(identifiers) - fucntion, that calls when translation finished,
     * and notify, that view must be updated
     */
    registerListener: function(listener) {
        if (this.listeners.indexOf(listener) == -1) {
            this.listeners.push(listener);
        }
    },
    
    /**
     * @param {Object} listener Listener objects that need to be unregistered
     */
    unregisterListener: function(listener) {
        var idx = this.listeners.indexOf(listener);
        if (idx >= 0) {
            this.listeners.splice(idx, 1);
        }
    },
    
    /**
     * @param {String} sc-addr of new identifiers language 
     */
    languageChanged: function(language) {
        this.current_language = language;
         
        // collect objects, that need to be translated
        var objects = [];
        for (var i = 0; i < this.listeners.length; i++) {
            objects = objects.concat(this.listeners[i].getObjectsToTranslate());
        }
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        this.translate(objects, language, function(namesMap) {
            // notify listeners for new translations
            for (var i = 0; i < self.listeners.length; i++) {
                self.listeners[i].updateTranslation(namesMap);
            }
        });
        
     },
      
    /**
     * @param {Array} objects List of sc-addrs, that need to be translated
     * @param {String} language It it value is null, then current language used
     * @return Return object, that contains [key, value], where 
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function(objects, language, callback) {
        var lang = language;
        
        if (!language)
            lang = this.current_language;
        
        SCWeb.core.Server.resolveIdentifiers(objects, lang, function(namesMap) {
            callback(namesMap);
        });
    },

};
