SCWeb.core.Main = {
    
    outputLanguages: [],
    identifierLanguages: [],
    userCommands: {},
    
    init: function(callback) {
        var self = this;
        
        SCWeb.core.ui.TaskPanel.init(); // need to be initiated before any ajax request
        SCWeb.core.Server.init(function(data) {
            self.outputLanguages = data.outLangs;
            self.identifierLanguages = data.idtfLangs;
            self.userCommands = data.commands;
            
            SCWeb.core.utils.Keyboard.init(function() {
                self._initUI();
                SCWeb.core.ComponentManager.init(callback);
            });
        });
    },

    _initUI: function() {
        
        SCWeb.core.ui.Menu.init();
        SCWeb.core.ui.OutputLanguages.init();
        SCWeb.core.ui.ArgumentsPanel.init();
        SCWeb.core.ui.Windows.init();
        SCWeb.core.ui.IdentifiersLanguages.init();
    }
};

/*$(function() {
    SCWeb.core.Main.init();
});*/
