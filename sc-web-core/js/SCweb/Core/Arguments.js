SCWeb.core.Arguments = {

    _listeners : [],
    _arguments : [],

    /**
     * Append new argument into the end of list
     * 
     * @param {String}
     *            argument SC-addr of command argument
     * @return Returns index of appended argument
     */
    appendArgument : function(argument) {

        this._arguments.push(argument);

        var idx = this._arguments.length - 1;
        this._fireArgumentAppended(argument, idx);

        return idx;
    },

    /**
     * Removes first occurrence of specified argument
     * 
     * @param {String}
     *            argument SC-add of argument to remove
     */
    removeArgument : function(argument) {

        var idx = this._arguments.indexOf(argument);

        if (idx >= 0) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);

            this._fireArgumentAppended(arg, idx);
        }
    },

    /**
     * Remove argument by specified index
     * 
     * @param {Number}
     *            idx Index of argument to remove
     */
    removeArgumentByIndex : function(idx) {

        if (idx < this._arguments.length) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);

            this._fireArgumentRemoved(arg, idx);
        }
    },

    /**
     * Clears arguments list
     */
    clear : function() {

        this._arguments = [];
        this._fireArgumentCleared();
    },

    /**
     * @param {Object}
     *            listener Listener object, that will recieve notifitacions on
     *            arguments list changes. It must have such functions as: -
     *            argumentAppended(argument, idx) - argumentRemoved(argument,
     *            idx) - argumentsCleared(arguments)
     */
    registerListener : function(listener) {

        if (this._listeners.indexOf(listener) == -1) {
            this._listeners.push(listener);
        }
    },

    /**
     * @param {Object}
     *            listener Listener objects that need to be unregistered
     */
    unregisterListener : function(listener) {

        var idx = this._listeners.indexOf(listener);
        if (idx >= 0) {
            this._listeners.splice(idx, 1);
        }
    },

    /**
     * Notify listener on argument added
     * 
     * @param {String}
     *            argument Argument, that was added *
     * @param {Number}
     *            Index of added argument
     */
    _fireArgumentAppended : function(argument, idx) {

        for ( var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].argumentAppended(argument, idx);
        }
    },

    /**
     * Notify listener on argument removed
     * 
     * @param {String}
     *            argument Argument, that was removed
     * @param {Number}
     *            Index of removed argument
     */
    _fireArgumentRemoved : function(argument, idx) {

        for ( var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].argumentRemoved(argument, idx);
        }
    },

    /**
     * Notify listener on argument clear
     */
    _fireArgumentCleared : function() {

        for ( var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].argumentsCleared();
        }
    },

    /**
     * Retrieves all available arguments to caller object.
     * 
     * @returns {Array} the array of available arguments.
     */
    getArguments : function() {

        return this._arguments;
    }

};
