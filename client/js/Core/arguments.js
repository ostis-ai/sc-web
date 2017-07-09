/**
 * Object controls list of command parameters.
 * It can fires next events:
 * - "arguments/add" - this event emits on new argument add. Parameters: arg, idx
 * where:
 *        - arg - is a sc-addr of object that added as argument;
 *        - idx - is an index of the argument
 * - "arguments/remove" - this event emits on argument remove. Parameters: arg, idx
 * where:
 *        - arg - is a sc-addr of object that removed from arguments;
 *        - idx - is an index of the argument
 * - "arguments/clear" - this event emits on arguments clear (all arguments removed at once)
 */
SCWeb.core.Arguments = {

    _arguments: [],

    /**
     * Append new argument into the end of list
     *
     * @param {String}
     * argument SC-addr of command argument
     * @return Returns index of appended argument
     */
    appendArgument: function (argument) {

        this._arguments.push(argument);

        var idx = this._arguments.length - 1;
        this._fireArgumentAppended(argument, idx);

        return idx;
    },

    /**
     * Removes first occurrence of specified argument
     *
     * @param {String}
     * argument SC-add of argument to remove
     */
    removeArgument: function (argument) {

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
     * idx Index of argument to remove
     */
    removeArgumentByIndex: function (idx) {

        if (idx < this._arguments.length) {
            var arg = this._arguments[idx];
            this._arguments.splice(idx, 1);

            this._fireArgumentRemoved(arg, idx);
        }
    },

    /**
     * Clears arguments list
     */
    clear: function () {

        this._arguments = [];
        this._fireArgumentCleared();
    },

    /**
     * Notify listener on argument added
     *
     * @param {String}
     * argument Argument, that was added *
     * @param {Number}
     * Index of added argument
     */
    _fireArgumentAppended: function (argument, idx) {

        SCWeb.core.EventManager.emit("arguments/add", argument, idx);
    },

    /**
     * Notify listener on argument removed
     *
     * @param {String}
     * argument Argument, that was removed
     * @param {Number}
     * Index of removed argument
     */
    _fireArgumentRemoved: function (argument, idx) {

        SCWeb.core.EventManager.emit("arguments/remove", argument, idx);
    },

    /**
     * Notify listener on argument clear
     */
    _fireArgumentCleared: function () {

        SCWeb.core.EventManager.emit("arguments/clear");
    },

    /**
     * Retrieves all available arguments to caller object.
     *
     * @returns {Array} the array of available arguments.
     */
    getArguments: function () {

        return this._arguments;
    }

};
