DeleteButtons = {

    init: function() {
        return new Promise(resolve => {
            var delete_from_working_place_button_identifier = 'ui_scg_control_tool_delete_from_working_place';
            var delete_from_db_button_identifier = 'ui_scg_control_tool_delete_from_knowledge_base';
            this.delete_buttons_container_id = '#' + 'delete_buttons_container';

            var self = this;

            SCWeb.core.Server.resolveScAddr([delete_from_working_place_button_identifier, delete_from_db_button_identifier]).then(function (addrs) {
                var delete_from_wp = addrs[delete_from_working_place_button_identifier];
                var delete_from_db = addrs[delete_from_db_button_identifier];

                if (delete_from_wp) {
                    SCWeb.core.Server.resolveIdentifiers([delete_from_wp]).then(function (translation) {
                        $(self.delete_buttons_container_id + ' button.delete-from-scene-btn').
                        attr('sc_addr', delete_from_wp).text(translation[delete_from_wp]);

                        SCWeb.core.EventManager.subscribe("translation/update", self, self.updateTranslation);
                        SCWeb.core.EventManager.subscribe("translation/get", self, function (objects) {
                            $(self.delete_buttons_container_id + ' [sc_addr]').each(function (index, element) {
                                objects.push($(element).attr('sc_addr'));
                            });
                        });
                        resolve();
                    });
                }

                if(delete_from_db) {
                    SCWeb.core.Server.resolveIdentifiers([delete_from_db]).then(function (translation) {
                        $(self.delete_buttons_container_id + ' button.delete-from-db-btn').
                        attr('sc_addr', delete_from_db).text(translation[delete_from_db]);

                        SCWeb.core.EventManager.subscribe("translation/update", self, self.updateTranslation);
                        SCWeb.core.EventManager.subscribe("translation/get", self, function (objects) {
                            $(self.delete_buttons_container_id + ' [sc_addr]').each(function (index, element) {
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
        $(this.delete_buttons_container_id + ' [sc_addr]').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    }
}