SCWeb.ui.Core = {
    
    init: function(data, callback) {
        var dfd = new jQuery.Deferred();

        $.when(SCWeb.ui.Menu.init(data),
               SCWeb.ui.ArgumentsPanel.init(),
               SCWeb.ui.UserPanel.init(data),
               SCWeb.ui.LanguagePanel.init(data),
               SCWeb.ui.WindowManager.init(data)
            ).done(function() {

                // listen clicks on sc-elements
                $('#window-container').delegate('[sc_addr]:not(.sc-window)', 'click', function(e) {
                    SCWeb.core.Main.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
                    e.stopPropagation();
                });
                dfd.resolve();
            });
        return dfd.promise();
    },
    
};
