SCWeb.ui.DeleteScgButtons = {

    init: function() {
        return new Promise(resolve => {
            var expert_mode_identifier = 'ui_scg_control_tool_delete_from_working_place';
            this.expert_mode_container_id = '#' + 'delete_buttons_container';
            var self = this;

            SCWeb.core.Server.resolveScAddr([expert_mode_identifier]).then(function (addrs) {
                var expert_mode_sc_addr = addrs[expert_mode_identifier];

                if (expert_mode_sc_addr) {
                    SCWeb.core.Server.resolveIdentifiers([expert_mode_sc_addr]).then(function (translation) {
                        $(self.expert_mode_container_id + ' button.delete-from-scene-btn').
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

    updateTranslation: function (namesMap) {
        $(this.expert_mode_container_id + ' [sc_addr]').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    }
}