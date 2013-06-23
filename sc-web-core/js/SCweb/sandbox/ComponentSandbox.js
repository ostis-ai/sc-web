SCWeb.sandbox.ComponentSandbox = function(container) {

    var _currentLanguage = null;
    var _eventHandlers = [];

    var _recieveData = function(eventData) {

        if (eventData.container == container) {
            this.fire(SCWeb.sandbox.events.Data.NEW, eventData.newData);
        }
    };

    var _onArgAppended = function(eventData) {

        this.fire(SCWeb.sandbox.events.Argument.APPENDED, eventData.argValue,
                eventData.argIndex);
    };

    var _onArgRemoved = function(eventData) {

        this.fire(SCWeb.sandbox.events.Argument.REMOVED, eventData.argValue,
                eventData.argIndex);
    };

    var _onArgCleared = function() {

        this.fire(SCWeb.sandbox.events.Argument.CLEARED);
    };

    var _onAppendArgument = function(scAddr) {

        SCWeb.core.Environment.fire(SCWeb.core.events.Argument.APPEND, scAddr);
    };

    var _getArguments = function() {

        return SCWeb.core.Environment
                .getResource(SCWeb.core.Resources.ARGUMENTS);
    };

    var _onDestroy = function(destroyedContainer) {

        if (destroyedContainer == con) {
            this.fire(SCWeb.sandbox.events.Component.DESTROY);
        }
    };

    var _onTranslUpdate = function(namesMap) {

        this.fire(SCWeb.sandbox.events.Translation.UPDATE, namesMap);
    };

    var _translate = function(eventData) {

        SCWeb.core.Environment.fire(SCWeb.core.events.Translation.TRANSLATE,
                eventData);
    };

    var _getViewer = function(eventData) {

        SCWeb.core.ui.Windows.createViewersForScLinks(eventData.nodesAddr,
                eventData.container);
    };

    return {
        init : function() {

            SCWeb.core.Environment.on(SCWeb.core.events.Data.NEW, $.proxy(
                    _recieveData, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Translation.UPDATE, $
                    .proxy(_onTranslUpdate, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.APPENDED, $
                    .proxy(_onArgAppended, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.REMOVED, $
                    .proxy(_onArgRemoved, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.CLEARED, $
                    .proxy(_onArgCleared, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Component.DESTROY_CONTAINER, $.proxy(
                            _onDestroy, this));
            this.register(SCWeb.sandbox.events.Argument.APPEND, $.proxy(
                    _onAppendArgument, this));
            this.register(SCWeb.sandbox.events.Argument.GET_ALL, $.proxy(
                    _getArguments, this));
            this.register(SCWeb.sandbox.events.Translation.TRANSLATE, $.proxy(
                    _translate, this));
            this.register(SCWeb.sandbox.events.Component.GET_VIEWER, $.proxy(
                    _getViewer, this));
        },

        register : function(eventName, handler) {

            _eventHandlers[eventName] = handler;
        },

        fire : function(eventName, eventData) {

            var handler = _eventHandlers[eventName];
            if (handler) {
                return handler(eventData);
            }
        },

        getIdentifiersLanguage : function() {

            return _currentLanguage;
        },

    };
};