SCWeb.core.EventManager = {

    events: {},

    /**
     * Subscribe handler for specified event
     * @param {String} evt_name Event name
     * @param {Object} context Context to call callback function
     * @param {callback} callback Callback function
     * @returns Returns event object
     */
    subscribe: function (evt_name, context, callback) {

        var event = {
            event_name: evt_name,
            func: callback,
            context: context
        };

        if (!this.events[evt_name]) {
            this.events[evt_name] = [event];
        } else {
            this.events[evt_name].push(event);
        }

        return event;
    },

    /**
     * Remove subscription
     * @param {Object} event Event object
     */
    unsubscribe: function (event) {

        for (var evt in this.events) {
            var funcs = this.events[evt];
            var idx = funcs.indexOf(event);
            if (idx >= 0) {
                funcs.splice(idx, 1);
            }
        }
    },

    /**
     * Emit specified event with params
     * First param - is an event name. Other parameters will be passed into callback
     */
    emit: function () {

        var params = Array.prototype.slice.call(arguments);
        var evt = params.splice(0, 1);

        var funcs = this.events[evt];
        if (funcs) {
            for (var f in funcs) {
                var e_obj = funcs[f];
                e_obj.func.apply(e_obj.context, params);
            }
        }
    }
};
