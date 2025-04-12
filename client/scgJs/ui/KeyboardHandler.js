/**
 * Created by rizhi-kote on 24.4.16.
 */
SCWeb.ui.KeyboardHandler = {

    events: {},

    init: function () {
        var self = this;

        $(window)
            .on('keydown', function (d3_event) {
                self.emit('onkeydown', d3_event);
            })
            .on('keyup', function (d3_event) {
                self.emit('onkeyup', d3_event);
            })
            .on('keypress', function (d3_event) {
                self.emit('onkeypress', d3_event);
            });
    },


    onKeyDown: function (d3_event) {
        this.getActiveWindow().onKeyDown(d3_event);
    },

    onKeyUp: function (d3_event) {
        this.getActiveWindow().onKeyUp(d3_event);
    },

    onKeyPress: function (d3_event) {
        this.getActiveWindow().onKeyPress(d3_event);
    },

    subscribe: function (evt_name, window_id, callback) {

        var event = {
            event_name: evt_name,
            func: callback,
            window_id: window_id
        };

        if (!this.events[evt_name]) {
            this.events[evt_name] = {};
            this.events[evt_name][window_id] = event;
        } else {
            this.events[evt_name][window_id] = event;
        }
    },

    subscribeWindow: function (window_id, callbackArray) {

        for (var eventType in callbackArray) {
            var func = callbackArray[eventType];
            if (typeof func !== typeof function () {
                }) {
                continue;
            }
            this.subscribe(eventType, window_id, func);
        }
    },

    /**
     * Remove subscription
     * @param {Object} event Event object
     */
    unsubscribe: function (event) {

        this.events[event.event_name][event.window_id] = undefined;
    },

    /**
     * Emit specified event with params
     * First param - is an event name. Other parameters will be passed into callback
     */
    emit: function (eventType, d3_event) {
        var windowId = SCWeb.ui.WindowManager.getActiveWindowId();
        if (!this.events[eventType] || !this.events[eventType][windowId])
            return;
        var callBack = this.events[eventType][windowId].func;
        if (callBack) {
            callBack(d3_event);
        }
    }
}
