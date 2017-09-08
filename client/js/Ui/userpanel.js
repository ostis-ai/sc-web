SCWeb.ui.UserPanel = {

    /*!
     * Initialize user panel.
     * @param {Object} params Parameters for panel initialization.
     * There are required parameters:
     * - sc_addr - sc-addr of user
     * - is_authenticated - flag that have True value, in case when user is authenticated
     * - current_lang - sc-addr of used natural language
     */
    init: function (params) {
        var dfd = new jQuery.Deferred();

        this.is_authenticated = params.user.is_authenticated;
        this.user_sc_addr = params.user.sc_addr;
        this.lang_mode_sc_addr = params.user.current_lang;
        this.default_ext_lang_sc_addr = params.user.default_ext_lang

        if (this.is_authenticated) {
            $('#auth-user-name').attr('sc_addr', this.user_sc_addr).text(this.user_sc_addr);
            $('#auth-user-lang').attr('sc_addr', this.lang_mode_sc_addr).text(this.lang_mode_sc_addr);
            $('#auth-user-ext-lang').attr('sc_addr', this.default_ext_lang_sc_addr).text(this.default_ext_lang_sc_addr);
        }

        // listen translation events
        SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function (objects) {
            $('#auth-user-panel [sc_addr]').each(function (index, element) {
                objects.push($(element).attr('sc_addr'));
            });
        });

        dfd.resolve();
        return dfd.promise();
    },

    // ---------- Translation listener interface ------------
    updateTranslation: function (namesMap) {
        // apply translation
        $('#auth-user-panel [sc_addr]').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr].replace('user::', '').replace('session::', ''));
            }
        });

    },


};
