SCWeb.core.Main = {
    
    window_types: [],
    idtf_modes: [],
    menu_commands: {},
    
    /**
     * Initialize sc-web core and ui
     * @param {Object} params Initializetion parameters.
     * There are required parameters:
     * - menu_container_id - id of dom element, that will contains menu items
     */
    init: function(params, callback) {
        var self = this;
        
        SCWeb.ui.TaskPanel.init(function() {
        
            SCWeb.core.Server.init(function(data) {
                self.window_types = data.window_types;
                self.lang_modes = data.lang_modes;
                self.menu_commands = data.menu_commands;
                
                var menu_params = {
                                menu_container_id: params.menu_container_id,
                                menu_commands: self.menu_commands
                            };
                SCWeb.ui.Menu.init(menu_params, function() {
                
                    SCWeb.ui.UserPanel.init(data.user, function() {
                        
                        SCWeb.ui.Locker.hide();
                        callback();
                    });
                });
            });
        });
    },

    _initUI: function() {

    }
};

