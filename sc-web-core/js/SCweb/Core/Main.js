SCWeb.core.Main = {
    init: function() {
        this._initUI();
    },

    _initUI: function() {
        SCWeb.core.ui.Locker.show();
        SCWeb.core.ui.Menu.init(function() {
            SCWeb.core.ui.OutputLanguages.init(function() {
                SCWeb.core.ui.IdentifiersLanguages.init(function() {
                    SCWeb.core.ui.Locker.hide();
                });
            });
        });
    }
};

$(function() {
    SCWeb.core.Main.init();
});
