SCWeb.core.Arguments = {
    
    _listener: null,
    _arguments: [],

    /**
     * Append new argument into the end of list
     * @param {String} argument SC-addr of command argument
     * @return Returns index of appended argument
     */
    appendArgument: function(argument) {
        this._arguments.push(argument);

        var idx = this._arguments.length - 1;
        this._fireArgumentAppended(argument, idx);
        
        return idx;
    },
    
    /**
     * Removes first occurrence of specified argument
     * @param {String} argument SC-add of argument to remove
     */
    removeArgument: function(argument) {
        var idx = this._arguments.indexOf(argument);
        
        if (idx >= 0) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);
            
            this._fireArgumentAppended(arg, idx);
        }
    },
    
    /**
     * Remove argument by specified index
     * @param {} idx Index of argument to remove
     */
    removeArgumentByIndex: function(idx) {
        if (idx < this._arguments.length) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);
            
            this._fireArgumentRemoved(arg, idx);
        }
    },
    
    /**
     * Clears arguments list
     */
    clear: function() {
        this._arguments.splice(0, this._arguments.length);
        this._fireArgumentCleared();
    },
    
    /**
     * @param {Object} listener Listener object, that will recieve notifitacions
     * on arguments list changes. It must have such functions as:
     * - argumentAppended(argument, idx) 
     * - argumentRemoved(argument, idx)
     * - argumentsCleared()
     */
    setListener: function(listener) {
        this._listener = listener;
    },
    
    /** 
     * Notify listener on argument added
     * @param {String} argument Argument, that was added
     * * @param {Integer} Index of added argument
     */
    _fireArgumentAppended: function(argument, idx) {
        if (this._listener != null) {
            this._listener.argumentAppended(argument, idx);
        }
    },
    
    /**
     * Notify listener on argument removed
     * @param {String} argument Argument, that was removed
     * @param {Integer} Index of removed argument
     */
    _fireArgumentRemoved: function(argument, idx) {
        if (this._listener != null) {
            this._listener.argumentRemoved(argument, idx);
        }
    },
    
    /**
     * Notify listener on argument clear
     */
    _fireArgumentCleared: function() {
        if (this._listener != null) {
            this._listener.argumentsCleared();
        }
    }
    
};
