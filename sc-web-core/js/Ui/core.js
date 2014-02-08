SCWeb.ui.Core = {
    
    init: function(data, callback) {
        var self = this;
        var dfd = new jQuery.Deferred();

        this.tooltip_interval = null;
        this.tooltip_element = null;

        function clearTooltipInterval() {
            if (self.tooltip_interval) {
                clearInterval(self.tooltip_interval);
                self.tooltip_interval = null;
            }
        }

        function destroyTooltip() {
            if (self.tooltip_element) {
                self.tooltip_element.tooltip('destroy');
                self.tooltip_element = null;
            }
        }

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
                    if (!SCWeb.ui.ArgumentsPanel.isArgumentAddState()) {
                        SCWeb.core.Main.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
                        e.stopPropagation();
                    }
                });

                $('body')
                .delegate(sc_elements_selector, 'mouseover', function(e) {
                    self.sc_icon.removeClass('hidden');
                    setCursorIconPos(e.pageX, e.pageY);

                    clearTooltipInterval();
                    self.tooltip_element = $(this);
                    self.tooltip_interval = setInterval(function() {
                        clearInterval(self.tooltip_interval);
                        self.tooltip_interval = null;

                        self.tooltip_element.tooltip({
                            html: true,
                            placement: 'auto',
                            trigger: 'manual',
                            title: '<div class="tooltip-empty"></div>',
                            animation: false
                        }).tooltip('show');
                        var addr = self.tooltip_element.attr('sc_addr');
                        if (addr) {
                            SCWeb.core.Server.getTooltips([addr], function(tips) {
                                var value = tips[addr];
                                if (value) {
                                    self.tooltip_element.tooltip('hide')
                                                .attr('data-original-title', value).tooltip('show');
                                } else
                                    destroyTooltip();
                            }, function() {
                                destroyTooltip();
                            });
                        }
                    }, 2000);
                })  
                .delegate(sc_elements_selector, 'mouseout', function(e) {
                    self.sc_icon.addClass('hidden');
                    setCursorIconPos(e.pageX, e.pageY);

                    clearTooltipInterval();
                    destroyTooltip();
                })
                .delegate(sc_elements_selector, 'mousemove', function(e) {
                    setCursorIconPos(e.pageX, e.pageY);
                }).delegate(sc_elements_selector, 'click', function(e) {
                    if (SCWeb.ui.ArgumentsPanel.isArgumentAddState()) {
                        SCWeb.core.Arguments.appendArgument($(this).attr('sc_addr'));
                        e.stopPropagation();
                    }
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
