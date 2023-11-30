SCWeb.ui.OpenComponentHandler = {

    events: {},

    subscribeComponent: function (windowId, callback) {
        this.events[windowId] = callback;
    },

    unsubscribeComponent: function (windowId) {
        delete this.events[windowId];
    },

    callOpenComponentCallback: function (windowId) {
        if (this.events.hasOwnProperty(windowId)) {
            this.events[windowId]();
        }
    }
};
