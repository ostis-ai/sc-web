SCWeb.core.Translation = {
    
    current_language: null,
    listeners: [],

    /**
     * cached identifiers
     */
    _cacheMap: {},
    
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
        for (i in this.listeners) {
            objects = objects.concat(this.listeners[i].getObjectsToTranslate());
        }
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        this.translate(objects, language, function(namesMap) {
            // notify listeners for new translations
            for (i in self.listeners) {
                self.listeners[i].updateTranslation(namesMap);
            }
        });
        
     },
      
    /**
     * @param {Array} objects List of sc-addrs, that need to be translated
     * @param {String} language It it value is null, then current language used
     * @param {Function} callback
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function(objects, language, callback) {
        var lang = language || this.current_language;

        var requiredNamesMap;
        var unachedAddresses = this._getUncachedNames(lang, objects);
        if(unachedAddresses.length === 0) {
            requiredNamesMap = this._getRequiredNamesMap(lang, objects);
            callback(requiredNamesMap);
        } else {
            var self = this;
            SCWeb.core.Server.resolveIdentifiers(unachedAddresses, lang, function(namesMap) {
                self._cacheNames(lang, namesMap);
                requiredNamesMap = self._getRequiredNamesMap(lang, objects);
                callback(requiredNamesMap);
            });
        }
    },

    _getUncachedNames: function(language, addresses) {
        if(!this._cacheMap[language]) {
            // nothing is cached for this language yet
            return addresses;
        } else {
            var uncachedAddressed = [], scAddress;
            for(i in addresses) {
                scAddress = addresses[i];
                // if not in cache for the specified language
                if(!this._cacheMap[language][scAddress]) {
                    uncachedAddressed.push(scAddress);
                }
            }
            return uncachedAddressed;
        }
    },

    _cacheNames: function(language, namesMap) {
        if(!this._cacheMap[language]) {
            this._cacheMap[language] = {};
        }

        var name;
        var scAddress;
        for(scAddress in namesMap) {
            if(namesMap.hasOwnProperty(scAddress)) {
                name = namesMap[scAddress];
                this._cacheMap[language][scAddress] = name;
            }
        }

    },

    _getRequiredNamesMap: function(language, addresses) {
        var names = {}, scAddress;
        for(i in addresses) {
            scAddress = addresses[i];
            names[scAddress] = this._cacheMap[language][scAddress];
        }
        return names;
    }
};
