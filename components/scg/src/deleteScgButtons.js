DeleteButtons = {

    init: function () {
        return new Promise(resolve => {
            var remove_from_working_place_btn_id = 'ui_scg_control_tool_clear_working_place_from_selected_elements';
            var delete_from_knowledge_base_btn_id = 'ui_scg_control_tool_remove_from_knowledge_base';
            this.delete_btn_cont_id = '#' + 'delete_buttons_container';

            var self = this;

            SCWeb.core.Server.resolveScAddr([remove_from_working_place_btn_id, delete_from_knowledge_base_btn_id]).then(function (addrs) {
                var delete_from_wp = addrs[remove_from_working_place_btn_id];
                var delete_from_db = addrs[delete_from_knowledge_base_btn_id];

                if (delete_from_wp) {
                    SCWeb.core.Server.resolveIdentifiers([delete_from_wp]).then(function (translation) {
                        $(self.delete_btn_cont_id + ' button.delete-from-scene-btn').
                            attr('sc_addr', delete_from_wp).text(translation[delete_from_wp]);

                        SCWeb.core.EventManager.subscribe("translation/update", self, self.updateTranslation);
                        SCWeb.core.EventManager.subscribe("translation/get", self, function (objects) {
                            $(self.delete_btn_cont_id + ' [sc_addr]').each(function (index, element) {
                                objects.push($(element).attr('sc_addr'));
                            });
                        });
                        resolve();
                    });
                }

                if (delete_from_db) {
                    SCWeb.core.Server.resolveIdentifiers([delete_from_db]).then(function (translation) {
                        $(self.delete_btn_cont_id + ' button.delete-from-db-btn').
                            attr('sc_addr', delete_from_db).text(translation[delete_from_db]);

                        SCWeb.core.EventManager.subscribe("translation/update", self, self.updateTranslation);
                        SCWeb.core.EventManager.subscribe("translation/get", self, function (objects) {
                            $(self.delete_btn_cont_id + ' [sc_addr]').each(function (index, element) {
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
        $(this.delete_btn_cont_id + ' [sc_addr]').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    }
}