SCWeb.ui.UserPanel = {
    
    /*!
     * Initialize user panel.
     * @param {Object} params Parameters for panel initialization.
     * There are required parameters:
     * - sc_addr - sc-addr of user
     * - is_authenticated - flag that have True value, in case when user is authenticated
     * - current_lang - sc-addr of used natural language
     */
    init: function(params, callback) {
        
        SCWeb.core.Server.appendListener(this);
        
        this.is_authenticated = params.is_authenticated;
        this.user_sc_addr = params.sc_addr;
        this.lang_mode_sc_addr = params.current_lang;
        
        if (this.is_authenticated) {
            $('#auth-user-name').attr('sc_addr', this.user_sc_addr).text(this.user_sc_addr);
            $('#auth-user-lang').attr('sc_addr', this.lang_mode_sc_addr).text(this.lang_mode_sc_addr);
        }
        
        callback();
    },

};
