SCWeb.core.Environment = (function() {

    var eventListeners = [];
    var resources = [];

    if (console) {
        console.log("Environment.body");
    }

    return {

        init : function() {

            if (console) {
                console.log("Environment.init");
            }
        },

        on : function(eventName, listener) {

            if (console) {
                // console.log("Environment.on-event=" + eventName + ",
                // listener="
                // + listener);
            }
            var listeners = eventListeners[eventName];
            if (!listeners) {
                listeners = new SCWeb.core.EnvironmentListeners(eventName);
                eventListeners[eventName] = listeners;
            }
            listeners.register(listener);
        },

        fire : function(eventName, eventData) {

            if (console) {
                console.log("Environment.fire-event=" + eventName + ", data="
                        + eventData);
            }
            var listeners = eventListeners[eventName];
            if (listeners) {
                listeners.notify(eventData);
            }
        },

        registerResource : function(resourceName, resourceProvider) {

            if (console) {
                // console.log("Environment.registerResource-event="
                // + resourceName + ", data=" + resourceProvider);
            }
            resources[resourceName] = resourceProvider;
        },

        getResource : function(resourceName) {

            if (console) {
                console.log("Enviroment.getResource-event=" + resourceName);
            }

            var resourceProvider = resources[resourceName];
            if (resourceProvider) {
                return resourceProvider();
            }
        }
    };
})();