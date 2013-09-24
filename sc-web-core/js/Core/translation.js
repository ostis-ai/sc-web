SCWeb.core.Translation = {
    
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
    
    /** Updates all translations
     */
    update: function(callback) {
         
        // collect objects, that need to be translated
        var objects = [];
        for (i in this.listeners) {
            objects = objects.concat(this.listeners[i].getObjectsToTranslate());
        }
        
        // @todo need to remove duplicates from object list
        // translate
        var self = this;
        this.translate(objects, function(namesMap) {
            // notify listeners for new translations
            for (i in self.listeners) {
                self.listeners[i].updateTranslation(namesMap);
            }
            
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
