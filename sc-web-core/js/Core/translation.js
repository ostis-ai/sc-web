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
    update: function(callback) {
         
        // collect objects, that need to be translated
        var objects = [];
        SCWeb.core.EventManager.emit("translation/get", objects);
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        this.translate(objects, function(namesMap) {
			// notify listeners for new translations
			SCWeb.core.EventManager.emit("translation/update", namesMap);
            callback();
        });
        
     },
      
    /**
     * @param {Array} objects List of sc-addrs, that need to be translated
     * @param {Function} callback
     * key is sc-addr of element and value is identifier.
     * If there are no key in returned object, then identifier wasn't found
     */
    translate: function(objects, callback) {

        var self = this;
        SCWeb.core.Server.resolveIdentifiers(objects, function(namesMap) {
            callback(namesMap);
        });
    }
    
};
