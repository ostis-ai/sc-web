SCWeb.ui.ExpertModePanel = {

    init: function () {
        return new Promise(resolve => {
            var expert_mode_identifier = 'ui_expert_mode';
            this.expert_mode_container_id = '#' + 'expert_mode_container';
            var self = this;
            SCWeb.core.Server.resolveScAddr([expert_mode_identifier]).then(function (addrs) {
                var expert_mode_sc_addr = addrs[expert_mode_identifier];
                if (expert_mode_sc_addr) {
                    SCWeb.core.Server.resolveIdentifiers([expert_mode_sc_addr]).then(function (translation) {
                        $(self.expert_mode_container_id + ' label.normalLabel').
                        attr('sc_addr', expert_mode_sc_addr).text(translation[expert_mode_sc_addr]);

                        SCWeb.core.EventManager.subscribe("translation/update", self, self.updateTranslation);
                        SCWeb.core.EventManager.subscribe("translation/get", self, function (objects) {
                            $(self.expert_mode_container_id + ' [sc_addr]').each(function (index, element) {
                                objects.push($(element).attr('sc_addr'));
                            });
                        });
                        resolve();
                    });
                }
            });
        })
    },

    // ---------- Translation listener interface ------------
    updateTranslation: function (namesMap) {
        // apply translation
        $(this.expert_mode_container_id + ' [sc_addr]').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    },
};
