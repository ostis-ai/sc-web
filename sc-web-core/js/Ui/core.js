SCWeb.ui.Core = {
    
    init: function(data, callback) {
        var self = this;
        var dfd = new jQuery.Deferred();

        $.when(SCWeb.ui.Menu.init(data),
               SCWeb.ui.ArgumentsPanel.init(),
               SCWeb.ui.UserPanel.init(data),
               SCWeb.ui.LanguagePanel.init(data),
               SCWeb.ui.WindowManager.init(data),
               SCWeb.ui.SearchPanel.init()
            ).done(function() {

                // listen clicks on sc-elements
                var sc_elements_selector = '[sc_addr]:not(.sc-window)';
                $('#window-container,#help-modal').delegate(sc_elements_selector, 'click', function(e) {
                    SCWeb.core.Main.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
                    e.stopPropagation();
                });
                
                $('#help-modal').on('shown.bs.modal', function() {
                    var body = $('#help-modal-body');
                    if (body.hasClass('modal-empty')) {
                        body.addClass('loading');
                        // try to find content
                        SCWeb.core.Server.resolveScAddr(['ui_start_help'], function(addrs) {
                            var a = addrs['ui_start_help'];
                            if (a) {
                                body.html('<div id="help-modal-content" class="sc-window" sc_addr="' + a + '"> </div>');
                                $.when(SCWeb.ui.WindowManager.createViewersForScLinks({'help-modal-content': a}))
                                .done(function() {
                                    body.removeClass('loading');
                                    body.removeClass('modal-empty');
                                });
                            }
                        });
                    }
                });

                self.sc_icon = $(".sc-cursor-icon");
                // cursor icon for all sc-elements
                function setCursorIconPos(x, y) {
                    self.sc_icon.offset({
                        top: y + 10,
                        left: x + 10
                    });
                }
                $('body')
                .delegate(sc_elements_selector, 'mouseover', function(e) {
                    self.sc_icon.removeClass('hidden');
                    setCursorIconPos(e.pageX, e.pageY);
                })  
                .delegate(sc_elements_selector, 'mouseout', function(e) {
                    self.sc_icon.addClass('hidden');
                    setCursorIconPos(e.pageX, e.pageY);
                })
                .delegate(sc_elements_selector, 'mousemove', function(e) {
                    setCursorIconPos(e.pageX, e.pageY);
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
