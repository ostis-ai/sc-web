SCWeb.core.EnvironmentListeners = function(name) {

    var listeners = [];
    return {

        register : function(listener) {

            listeners.push(listener);
        },

        notify : function(data) {

            for ( var lInd = 0; lInd < listeners.length; lInd++) {
                listeners[lInd](data);
            }
        }
    };
};