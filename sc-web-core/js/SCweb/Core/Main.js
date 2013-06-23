SCWeb.core.Main = {

    init : function(callback) {

        if (console) {
            console.log("---Main---");
        }
        SCWeb.core.Environment.init();
        SCWeb.core.ComponentManager.init(callback);
        SCWeb.core.ComponentContainerDecorator.init();
        SCWeb.core.ui.TaskPanel.init();
        SCWeb.core.Arguments.init();
        SCWeb.core.Translation.init();
        SCWeb.core.utils.Keyboard.init();
        this._initUI();
        var servInitCallback = $.proxy(function(data) {

            var startEvent = {};
            startEvent.outputLanguages = data.outLangs;
            startEvent.identifierLanguages = data.idtfLangs;
            startEvent.userCommands = data.commands;
            SCWeb.core.Environment.fire(SCWeb.core.events.Core.START,
                    startEvent);
        }, this);
        SCWeb.core.Server.init(servInitCallback);
    },

    _initUI : function() {

        SCWeb.core.ui.Menu.init();
        SCWeb.core.ui.OutputLanguages.init();
        SCWeb.core.ui.ArgumentsPanel.init();
        SCWeb.core.ui.Windows.init();
        SCWeb.core.ui.IdentifiersLanguages.init();
    }
};
