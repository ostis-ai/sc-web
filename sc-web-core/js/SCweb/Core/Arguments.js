SCWeb.core.Arguments = (function() {

    var _arguments = [];

    var _buildChangeArgEventData = function(argIndex, argValue) {

        var eData = {};
        eData.argIndex = argIndex;
        eData.argValue = argValue;
        return eData;
    };

    var _onRemoveArgument = function(argIndex, argValue) {

        var eventData = _buildChangeArgEventData(argIndex, argValue);
        SCWeb.core.Environment.fire(SCWeb.core.events.Argument.REMOVED,
                eventData);
    };

    return {
        init : function() {

            SCWeb.core.Environment.on(SCWeb.core.events.Argument.APPEND, $
                    .proxy(this.appendArgument, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.REMOVE, $
                    .proxy(this.removeArgument, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.REMOVE_IND, $
                    .proxy(this.removeArgumentByIndex, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.CLEAR, $
                    .proxy(this.clear, this));
            SCWeb.core.Environment.registerResource(
                    SCWeb.core.Resources.ARGUMENTS, $.proxy(this.getArguments,
                            this));
        },

        /**
         * Append new argument into the end of list
         * 
         * @param {String}
         *            argument SC-addr of command argument
         * @return Returns index of appended argument
         */
        appendArgument : function(argument) {

            _arguments.push(argument);
            var idx = _arguments.length - 1;
            var eventData = _buildChangeArgEventData(idx, argument);
            SCWeb.core.Environment.fire(SCWeb.core.events.Argument.APPENDED,
                    eventData);
            return idx;
        },

        /**
         * Removes first occurrence of specified argument
         * 
         * @param {String}
         *            argument SC-add of argument to remove
         */
        removeArgument : function(argument) {

            var idx = _arguments.indexOf(argument);
            if (idx >= 0) {
                var arg = _arguments[idx];
                _arguments.splice(idx, 1);
                _onRemoveArgument(idx, arg);
            }
        },

        /**
         * Remove argument by specified index
         * 
         * @param {Number}
         *            idx Index of argument to remove
         */
        removeArgumentByIndex : function(idx) {

            if (idx < _arguments.length) {
                var arg = _arguments[idx];
                _arguments.splice(idx, 1);
                _onRemoveArgument(idx, arg);
            }
        },

        /**
         * Clears arguments list
         */
        clear : function() {

            _arguments = [];
            SCWeb.core.Environment.fire(SCWeb.core.events.Argument.CLEARED);
        },

        /**
         * Retrieves all available arguments to caller object.
         * 
         * @returns {Array} the array of available arguments.
         */
        getArguments : function() {

            return _arguments;
        }
    };
})();
