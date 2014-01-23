SCWeb.ui.Core = {
    
    init: function(data, callback) {
        var dfd = new jQuery.Deferred();

        $.when(SCWeb.ui.Menu.init(data),
               SCWeb.ui.ArgumentsPanel.init(),
               SCWeb.ui.UserPanel.init(data),
               SCWeb.ui.LanguagePanel.init(data),
               SCWeb.ui.WindowManager.init(data),
               SCWeb.ui.SearchPanel.init()
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
    
    /*! Returns selector to select all elements, that has sc_addr in specified window, excluding all 
     * sc_addr elements in child windows
     */
    selectorWindowScAddr: function(windowId) {
        return windowId + ' [sc_addr]:not(' + windowId + ' .sc-content [sc_addr])';
    }
};
