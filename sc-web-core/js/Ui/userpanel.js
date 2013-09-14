SCWeb.ui.UserPanel = {
    
    /*!
     * Initialize user panel.
     * @param {Object} params Parameters for panel initialization.
     * There are required parameters:
     * - sc_addr - sc_addr of user
     * - is_authenticated - flag that have True value, in case when user is authenticated
     */
    init: function(params, callback) {
        
        SCWeb.core.Server.appendListener(this);
        
        this.is_authenticated = params.is_authenticated;
        this.user_sc_addr = params.sc_addr;
        
        if (this.is_authenticated) {
            $('#auth-user-name').attr('sc_addr', this.user_sc_addr).text(this.user_sc_addr);
        }
        
        callback();
    },

};
