SCWeb.core.Main = {
    init: function() {
        var self = this;
        SCWeb.core.utils.Keyboard.init(function() {
            self._initUI();
        });
    },

    _initUI: function() {
        SCWeb.core.ui.Locker.show();
        SCWeb.core.ui.TaskPanel.init(function() {
            SCWeb.core.ui.Menu.init(function() {           
                SCWeb.core.ui.OutputLanguages.init(function() {
                    SCWeb.core.ComponentManager.init(function() {
                        SCWeb.core.ui.ArgumentsPanel.init(function() {
                            SCWeb.core.ui.Windows.init(function() {
                                SCWeb.core.ui.IdentifiersLanguages.init(function() {
                                    SCWeb.core.ui.Locker.hide();
                                });
                            });
                        });
                    });
                });
            });
        });
    }
};

/*$(function() {
    SCWeb.core.Main.init();
});*/
