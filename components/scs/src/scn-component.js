SCnComponent = {
    ext_lang: 'scn_code',
    formats: ['format_scs_json'], // server side format to translate sc to format that processing Viewer
    factory: function (sandbox) {
        return new SCnViewer(sandbox);
    },
    getRequestKeynodes: function () {
        var keynodes = [
            'nrel_section_base_order',
            'rrel_key_sc_element',
            'nrel_key_sc_element_base_order',
            'scg_code',
            'lang_en',
            'lang_ru',
            "nrel_sc_text_translation",
            "rrel_example",
        ];
        return keynodes.concat(SCs.SCnSortOrder);
    }
};

var SCnViewer = function (sandbox) {
    this.objects = [];
    this.addrs = [];
    this.sc_links = {}; // map of sc-link objects key:addr, value: object
    this.data = null;

    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;
    this.expertModeModeManager = new ExpertModeManager(sandbox);
    SCWeb.core.EventManager.subscribe("expert_mode_changed", this, () => {
        this.sandbox.removeChild();
        this.receiveData(this.data);
    });

    SCWeb.core.EventManager.subscribe("translation/changed_language", this, () => {
        this.sandbox.removeChild();
        this.sandbox.command_state.lang = SCWeb.core.Translation.getCurrentLanguage();
        SCWeb.core.Main.getTranslatedAnswer(this.sandbox.command_state).then(link => {
            window.scClient.getLinkContents([new sc.ScAddr(parseInt(link))]).then(contents => {
                this.receiveData(contents[0].data);
            })
        });
    });

    // ---- window interface -----
    this.receiveData = async (data) => {
        this.data = data;
        data = JSON.parse(data);
        data = this.expertModeModeManager.applyExpertMode(data);
        this.viewer.appendData(data);
        SCWeb.ui.Locker.hide();
        return this.sandbox.createViewersForScLinks(this.viewer.getLinks());
    };

    this.sandbox.eventDataAppend = this.receiveData;

    this.viewer = new SCs.Viewer();
    this.viewer.init(sandbox, $.proxy(sandbox.getKeynode, sandbox));

    this.sandbox.updateContent();
};

var SCsConnectors = {};

$(document).ready(function () {
    SCsConnectors[sc_type_arc_pos_const_perm] = "->";
    SCsConnectors[sc_type_edge_common | sc_type_const] = "==";
    SCsConnectors[sc_type_edge_common | sc_type_var] = "_==";
    SCsConnectors[sc_type_arc_common | sc_type_const] = "=>";
    SCsConnectors[sc_type_arc_common | sc_type_var] = "_=>";
    SCsConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = "_->";
});


SCWeb.core.ComponentManager.appendComponentInitialize(SCnComponent);
