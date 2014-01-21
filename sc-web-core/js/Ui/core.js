SCWeb.ui.Core = {
    
    init: function(data, callback) {
        var dfd = new jQuery.Deferred();

        $.when(SCWeb.ui.Menu.init(data),
               SCWeb.ui.ArgumentsPanel.init(),
               SCWeb.ui.UserPanel.init(data),
               SCWeb.ui.LanguagePanel.init(data),
               SCWeb.ui.WindowManager.init(data)
            ).done(function() {
                dfd.resolve();
            });
        return dfd.promise();
    },
    
};
