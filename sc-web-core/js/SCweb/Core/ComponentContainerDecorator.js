SCWeb.core.ComponentContainerDecorator = (function() {

    /**
     * Binds component event handler for the obtaining semantic neighbourhood.
     * 
     * @param {String}
     *            windowId The component window id
     * @param {String}
     *            outputLanguage The SC address of the component output language
     */
    var _bindSemanticNeighbourhoodHandler = function(wndContainerId,
            outputLanguage) {

        var wndSelector = '#' + wndContainerId;
        var semNeighbrhdHandler = function(event, scAddr) {

            SCWeb.core.Server.getSemanticNeighbourhood(scAddr, outputLanguage,
                    function(data) {

                        var eventData = {};
                        eventData.container = wndContainerId;
                        eventData.newData = data;
                        SCWeb.core.Environment.fire(SCWeb.core.events.Data.NEW,
                                eventData);
                    });
        };
        $(wndSelector).bind('semanticNeighbourhood', semNeighbrhdHandler);
    };

    /**
     * Unbinds component event handler for the obtaining semantic neighbourhood.
     * 
     * @param {String}
     *            windowId The component window id
     */
    var _unbindSemanticNeighbourhoodHandler = function(wndNum) {

        var wndContainerSelector = '#' + _buildWndContainerId(wndNum);
        $(wndContainerSelector).unbind('semanticNeighbourhood');
    };

    return {
        init : function() {

            SCWeb.core.Environment.on(
                    SCWeb.core.events.Component.NEW_CONTAINER, $.proxy(
                            this.onNewContainer, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Component.DESTROY_CONTAINER, $.proxy(
                            this.onDestroyContainer, this));
        },

        onNewContainer : function(eventData) {

            _bindSemanticNeighbourhoodHandler(eventData.container,
                    eventData.outLang);
        },

        onDestroyContainer : function(containerId) {

            _unbindSemanticNeighbourhoodHandler(containerId);
        }
    };
})();