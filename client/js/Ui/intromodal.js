SCWeb.ui.IntroModal = {

    init: function () {
        return new Promise(resolve => {
            this.idToIdtfMap = {
                '#modal-content-header': 'ui_intro_modal_header',
                '#modal-content-pre-img-text': 'ui_intro_modal_content_pre_img',
                '#modal-content-post-img-text': 'ui_intro_modal_content_post_img',
                '#intro-modal-ok-button': 'ui_intro_modal_ok_button',
                '#intro-modal-dont-show-again-button': 'ui_intro_modal_dont_show_again_button'
            }

            const self = this;
            for (let id in this.idToIdtfMap) {
                SCWeb.core.Server.resolveScAddr([self.idToIdtfMap[id]]).then(function (addrs) {
                    const sc_addr = addrs[self.idToIdtfMap[id]];
                    if (sc_addr) {
                        SCWeb.core.Server.resolveIdentifiers([sc_addr]).then(function (translation) {
                            $(id).attr('sc_addr', sc_addr).text(translation[sc_addr]);
                            SCWeb.core.EventManager.subscribe("translation/update", self, self.updateTranslation.bind(self));
                            SCWeb.core.EventManager.subscribe("translation/get", self, function (objects) {
                                $(id + ' [sc_addr]').each(function (index, element) {
                                    objects.push($(element).attr('sc_addr'));
                                });
                            });
                            resolve();
                        });
                    }
                });
            }
        })
    },

    // ---------- Translation listener interface ------------
    updateTranslation: function (namesMap) {
        for (let id in this.idToIdtfMap) {
            $(id + ' [sc_addr]').each(function (index, element) {
                var addr = $(element).attr('sc_addr');
                if (namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                }
            });
        }
    },
};
